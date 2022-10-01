use std::{
    collections::{HashMap, HashSet},
    fs, io,
    path::Path,
    sync::Arc,
};

use mysql::{prelude::Queryable, PooledConn};
use s3::Bucket;
use tokio::sync::RwLock;

use crate::deployments::filesystem::has_deployment_code;

use self::filesystem::{
    create_deployments_folder, rm_deployment, write_deployment, write_deployment_asset,
};

pub mod assets;
pub mod filesystem;
pub mod pubsub;

#[derive(Debug, Clone)]
pub struct Deployment {
    pub id: String,
    pub function_id: String,
    pub domains: HashSet<String>,
    pub assets: HashSet<String>,
    pub environment_variables: HashMap<String, String>,
    pub memory: usize,  // in MB (MegaBytes)
    pub timeout: usize, // in ms (MilliSeconds)
}

pub async fn get_deployments(
    mut conn: PooledConn,
    bucket: Bucket,
) -> Arc<RwLock<HashMap<String, Deployment>>> {
    let deployments = Arc::new(RwLock::new(HashMap::new()));

    let mut deployments_list: HashMap<String, Deployment> = HashMap::new();

    conn.query_map(
        r"
        SELECT
            Deployment.id,
            Function.id,
            Function.memory,
            Function.timeout,
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
        |(id, function_id, memory, timeout, domain, asset): (
            String,
            String,
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
                });
        },
    )
    .unwrap();

    let deployments_list = deployments_list.values().cloned().collect();

    if let Err(error) = create_deployments_folder() {
        println!("Could not create deployments folder: {}", error);
    }

    if let Err(error) = delete_old_deployments(&deployments_list).await {
        println!("Failed to delete old deployments: {:?}", error);
    }

    {
        let mut deployments = deployments.write().await;

        for deployment in deployments_list {
            if !has_deployment_code(&deployment) {
                if let Err(error) = download_deployment(&deployment, &bucket).await {
                    println!("Failed to download deployment: {:?}", error);
                }
            }

            for domain in deployment.domains.clone() {
                deployments.insert(domain, deployment.clone());
            }
        }
    }

    deployments
}

async fn delete_old_deployments(deployments: &Vec<Deployment>) -> io::Result<()> {
    let local_deployments_files = fs::read_dir(Path::new("deployments"))?;

    for local_deployment_file in local_deployments_files {
        let local_deployment_file = local_deployment_file.unwrap();
        let local_deployment_file_name = local_deployment_file
            .file_name()
            .into_string()
            .unwrap_or("".into());

        // Skip folders
        if !local_deployment_file_name.ends_with(".js") {
            continue;
        }

        let local_deployment_id = local_deployment_file_name.replace(".js", "");

        if !deployments
            .iter()
            .any(|deployment| deployment.id == local_deployment_id)
        {
            rm_deployment(local_deployment_id)?;
        }
    }

    Ok(())
}

pub async fn download_deployment(deployment: &Deployment, bucket: &Bucket) -> io::Result<()> {
    match bucket.get_object(deployment.id.clone() + ".js").await {
        Ok(object) => {
            write_deployment(deployment.id.clone(), object.bytes())?;

            if deployment.assets.len() > 0 {
                for asset in &deployment.assets {
                    let object = bucket
                        .get_object(deployment.id.clone() + "/" + asset.as_str())
                        .await;

                    if let Err(error) = object {
                        return Err(io::Error::new(io::ErrorKind::Other, error));
                    }

                    let object = object.unwrap();
                    write_deployment_asset(deployment.id.clone(), asset, object.bytes())?;
                }
            }

            Ok(())
        }
        Err(error) => Err(io::Error::new(io::ErrorKind::Other, error)),
    }
}
