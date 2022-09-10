use std::{env, fs, io::{self, Write}, path::Path, sync::Arc, collections::HashMap};

use mysql::{PooledConn, prelude::Queryable};
use s3::Bucket;
use tokio::sync::RwLock;

pub mod assets;

#[derive(Debug, Clone)]
pub struct Deployment {
    pub id: String,
    pub domains: Vec<String>,
    pub assets: Vec<String>,
}

pub async fn get_deployments(mut conn: PooledConn, bucket: Bucket) -> Arc<RwLock<HashMap<String, Deployment>>> {
    let deployments = Arc::new(RwLock::new(HashMap::new()));

    let deployments_list = conn.query_map(r"
        SELECT
            Deployment.id,
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
    ", |(id, domain, asset): (String, Option<String>, Option<String>)| {
        Deployment {
            id,
            domains: domain.map(|d| vec![d]).unwrap_or(vec![]),
            assets: asset.map(|a| vec![a]).unwrap_or(vec![]),
        }
    }).unwrap();

    println!("Deployments: {:?}", deployments_list);

    delete_old_deployments(&deployments_list).await;

    {
        let mut deployments = deployments.write().await;

        for deployment in deployments_list {
            for domain in deployment.domains.clone() {
                let deployment = deployment.clone();

                if !has_deployment_code(&deployment) {
                    download_deployment(&deployment, &bucket).await;
                }

                deployments.insert(domain, deployment);
            }
        }
    }

    deployments
}

async fn delete_old_deployments(deployments: &Vec<Deployment>) {
    let local_deployments_files = fs::read_dir(Path::new("deployments")).unwrap();

    for local_deployment_file in local_deployments_files {
        let local_deployment_file = local_deployment_file.unwrap();
        let local_deployment_file_name = local_deployment_file.file_name().into_string().unwrap();

        // Skip folders
        if !local_deployment_file_name.ends_with(".js") {
            continue;
        }

        let local_deployment_id = local_deployment_file_name.replace(".js", "");

        if !deployments.iter().any(|deployment| deployment.id == local_deployment_id) {
            fs::remove_file(Path::new("deployments").join(local_deployment_file_name)).unwrap();
            // Don't unwrap because it's possible that folder doesn't exists
            fs::remove_dir(Path::new("deployments").join(local_deployment_id));
        }
    }
}

fn has_deployment_code(deployment: &Deployment) -> bool {
    let path = Path::new("deployments").join(deployment.id.clone() + ".js");

    path.exists()
}

async fn download_deployment(deployment: &Deployment, bucket: &Bucket) {
    let content = bucket.get_object(deployment.id.clone() + ".js").await.unwrap();

    let mut file = fs::File::create(Path::new("deployments").join(deployment.id.clone() + ".js")).unwrap();
    file.write_all(content.bytes()).unwrap();

    if deployment.assets.len() > 0 {
        for asset in &deployment.assets {
            let content = bucket.get_object(deployment.id.clone() + "/" + asset.as_str()).await.unwrap();

            let mut file = fs::File::create(Path::new("deployments").join(deployment.id.clone() + "/" + asset.as_str())).unwrap();
            file.write_all(content.bytes()).unwrap();
        }
    }
}

pub fn get_deployment_code(deployment: &Deployment) -> io::Result<String> {
    let path = Path::new(env::current_dir().unwrap().as_path())
        .join("deployments")
        .join(deployment.id.clone() + ".js");
    let code = fs::read_to_string(path)?;

    Ok(code)
}
