use crate::get_region;
use anyhow::{anyhow, Result};
use dashmap::DashMap;
use futures::{stream::FuturesUnordered, StreamExt};
use lagon_runtime_utils::{Deployment, DEPLOYMENTS_DIR};
use lagon_serverless_downloader::Downloader;
use log::{error, info, warn};
use mysql::{prelude::Queryable, PooledConn};
use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
    sync::Arc,
};

use self::filesystem::{create_deployments_folder, rm_deployment};

pub mod cache;
pub mod filesystem;
pub mod pubsub;

pub type Deployments = Arc<DashMap<String, Arc<Deployment>>>;

pub async fn download_deployment<D>(deployment: &Deployment, downloader: Arc<D>) -> Result<()>
where
    D: Downloader,
{
    let path = format!("{}.js", deployment.id);

    match downloader.download(&path).await {
        Ok(object) => {
            deployment.write_code(&object)?;
            info!(deployment = deployment.id; "Wrote deployment");

            if !deployment.assets.is_empty() {
                let mut futures = FuturesUnordered::new();

                for asset in &deployment.assets {
                    futures.push(async {
                        let path = format!("{}/{}", deployment.id, asset.clone());
                        let future = downloader.download(&path);

                        (future.await, asset.clone())
                    });
                }

                while let Some((result, asset)) = futures.next().await {
                    match result {
                        Ok(object) => {
                            deployment.write_asset(&asset, &object)?;
                        }
                        Err(error) => {
                            warn!(deployment = deployment.id, asset = asset; "Failed to download deployment asset: {}", error)
                        }
                    };
                }
            }

            Ok(())
        }
        Err(error) => Err(anyhow!(error)),
    }
}

#[derive(Deserialize)]
struct AssetObj(Vec<String>);

type QueryResult = (
    String,
    bool,
    String,
    String,
    String,
    usize,
    usize,
    usize,
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
);

pub async fn get_deployments<D>(mut conn: PooledConn, downloader: Arc<D>) -> Result<Deployments>
where
    D: Downloader,
{
    let deployments = Arc::new(DashMap::new());
    let mut deployments_list: HashMap<String, Deployment> = HashMap::new();

    conn.query_map(
        format!(
            "
SELECT
    Deployment.id,
    Deployment.isProduction,
    Deployment.assets,
    Function.id,
    Function.name,
    Function.memory,
    Function.tickTimeout,
    Function.totalTimeout,
    Function.cron,
    Domain.domain,
    EnvVariable.key,
    EnvVariable.value
FROM
    Deployment
INNER JOIN Function
    ON Deployment.functionId = Function.id
LEFT JOIN Domain
    ON Function.id = Domain.functionId
LEFT JOIN EnvVariable 
    ON Function.id = EnvVariable.functionId
WHERE
    Function.cron IS NULL
OR
    Function.cronRegion = '{}'
",
            get_region()
        ),
        |(
            id,
            is_production,
            assets,
            function_id,
            function_name,
            memory,
            tick_timeout,
            total_timeout,
            cron,
            domain,
            env_key,
            env_value,
        ): QueryResult| {
            let assets = serde_json::from_str::<AssetObj>(&assets)
                .map(|asset_obj| asset_obj.0)
                .unwrap_or_default();

            deployments_list
                .entry(id.clone())
                .and_modify(|deployment| {
                    if let Some(domain) = domain.clone() {
                        deployment.domains.insert(domain);
                    }

                    deployment.assets.extend(assets.clone());

                    if let Some(env_key) = env_key.clone() {
                        deployment
                            .environment_variables
                            .insert(env_key, env_value.clone().unwrap_or_default());
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
                    assets: HashSet::from_iter(assets.iter().cloned()),
                    environment_variables: env_key
                        .map(|key| {
                            let mut environment_variables = HashMap::new();
                            environment_variables.insert(key, env_value.unwrap_or_default());
                            environment_variables
                        })
                        .unwrap_or_default(),
                    memory,
                    tick_timeout,
                    total_timeout,
                    is_production,
                    cron,
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

    futures::future::join_all(deployments_list.into_iter().map(|deployment| async {
        if !deployment.has_code() {
            if let Err(error) = download_deployment(&deployment, Arc::clone(&downloader)).await {
                error!("Failed to download deployment {}: {}", deployment.id, error);
                return;
            }
        }

        let deployment = Arc::new(deployment);

        for domain in deployment.get_domains() {
            deployments.insert(domain, Arc::clone(&deployment));
        }
    }))
    .await;

    Ok(deployments)
}

async fn delete_old_deployments(deployments: &[Deployment]) -> Result<()> {
    info!("Deleting old deployments");
    let local_deployments_files = fs::read_dir(Path::new(DEPLOYMENTS_DIR))?;

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
