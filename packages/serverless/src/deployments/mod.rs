use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
    sync::Arc,
};

use anyhow::{anyhow, Result};
use log::{error, info};
use mysql::{prelude::Queryable, PooledConn};
use s3::Bucket;
use tokio::sync::RwLock;

use crate::deployments::filesystem::has_deployment_code;

use self::filesystem::{
    create_deployments_folder, rm_deployment, write_deployment, write_deployment_asset,
};

pub mod assets;
pub mod cache;
pub mod filesystem;
pub mod pubsub;

#[derive(Debug, Clone)]
pub struct Deployment {
    pub id: String,
    pub function_id: String,
    pub function_name: String,
    pub domains: HashSet<String>,
    pub assets: HashSet<String>,
    pub environment_variables: HashMap<String, String>,
    pub memory: usize,          // in MB (MegaBytes)
    pub timeout: usize,         // in ms (MilliSeconds)
    pub startup_timeout: usize, // in ms (MilliSeconds)
    pub is_production: bool,
}

impl Deployment {
    pub fn get_domains(&self) -> Vec<String> {
        let mut domains = Vec::new();

        domains.push(format!(
            "{}.{}",
            self.id,
            dotenv::var("LAGON_ROOT_DOMAIN").expect("LAGON_ROOT_DOMAIN must be set")
        ));

        // Default domain (function's name) and custom domains are only set in production deployments
        if self.is_production {
            domains.push(format!(
                "{}.{}",
                self.function_name,
                dotenv::var("LAGON_ROOT_DOMAIN").expect("LAGON_ROOT_DOMAIN must be set")
            ));

            domains.extend(self.domains.clone());
        }

        domains
    }

    pub async fn download(&self, bucket: &Bucket) -> Result<()> {
        match bucket.get_object(self.id.clone() + ".js").await {
            Ok(object) => {
                write_deployment(&self.id, object.bytes())?;

                if !self.assets.is_empty() {
                    for asset in &self.assets {
                        match bucket
                            .get_object(self.id.clone() + "/" + asset.as_str())
                            .await
                        {
                            Ok(object) => write_deployment_asset(&self.id, asset, object.bytes())?,
                            Err(error) => return Err(anyhow!(error)),
                        };
                    }
                }

                Ok(())
            }
            Err(error) => Err(anyhow!(error)),
        }
    }
}

pub async fn get_deployments(
    mut conn: PooledConn,
    bucket: Bucket,
) -> Result<Arc<RwLock<HashMap<String, Arc<Deployment>>>>> {
    let deployments = Arc::new(RwLock::new(HashMap::new()));

    let mut deployments_list: HashMap<String, Deployment> = HashMap::new();

    conn.query_map(
        r"
        SELECT
            Deployment.id,
            Deployment.isProduction,
            Function.id,
            Function.name,
            Function.memory,
            Function.timeout,
            Function.startupTimeout,
            Domain.domain,
            Asset.name
        FROM
            Deployment
        INNER JOIN Function
            ON Deployment.functionId = Function.id
        LEFT JOIN Domain
            ON Function.id = Domain.functionId
        LEFT JOIN Asset
            ON Deployment.id = Asset.deploymentId
    ",
        |(
            id,
            is_production,
            function_id,
            function_name,
            memory,
            timeout,
            startup_timeout,
            domain,
            asset,
        ): (
            String,
            bool,
            String,
            String,
            usize,
            usize,
            usize,
            Option<String>,
            Option<String>,
        )| {
            deployments_list
                .entry(id.clone())
                .and_modify(|deployment| {
                    if let Some(domain) = domain.clone() {
                        deployment.domains.insert(domain);
                    }

                    if let Some(asset) = asset.clone() {
                        deployment.assets.insert(asset);
                    }
                })
                .or_insert(Deployment {
                    id,
                    function_id,
                    function_name,
                    domains: domain
                        .map(|domain| {
                            let mut domains = HashSet::new();
                            domains.insert(domain);
                            domains
                        })
                        .unwrap_or_default(),
                    assets: asset
                        .map(|asset| {
                            let mut assets = HashSet::new();
                            assets.insert(asset);
                            assets
                        })
                        .unwrap_or_default(),
                    environment_variables: HashMap::new(),
                    memory,
                    timeout,
                    startup_timeout,
                    is_production,
                });
        },
    )?;

    let deployments_list: Vec<Deployment> = deployments_list.values().cloned().collect();

    info!("Found {} deployment(s) to deploy", deployments_list.len());

    if let Err(error) = create_deployments_folder() {
        error!("Could not create deployments folder: {}", error);
    }

    if let Err(error) = delete_old_deployments(&deployments_list).await {
        error!("Failed to delete old deployments: {:?}", error);
    }

    {
        let mut deployments = deployments.write().await;

        for deployment in deployments_list {
            if !has_deployment_code(&deployment) {
                if let Err(error) = deployment.download(&bucket).await {
                    error!("Failed to download deployment {}: {}", deployment.id, error);
                    continue;
                }
            }

            for domain in deployment.get_domains() {
                deployments.insert(domain, Arc::new(deployment.clone()));
            }
        }
    }

    Ok(deployments)
}

async fn delete_old_deployments(deployments: &[Deployment]) -> Result<()> {
    info!("Deleting old deployments");
    let local_deployments_files = fs::read_dir(Path::new("deployments"))?;

    for local_deployment_file in local_deployments_files {
        let local_deployment_file_name = local_deployment_file?
            .file_name()
            .into_string()
            .unwrap_or_else(|_| "".into());

        // Skip folders
        if !local_deployment_file_name.ends_with(".js") {
            continue;
        }

        let local_deployment_id = local_deployment_file_name.replace(".js", "");

        if !deployments
            .iter()
            .any(|deployment| deployment.id == local_deployment_id)
        {
            rm_deployment(&local_deployment_id)?;
        }
    }
    info!("Old deployments deleted");

    Ok(())
}
