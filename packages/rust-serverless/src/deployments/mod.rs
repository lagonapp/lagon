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

fn has_deployment_code(deployment: &Deployment) -> bool {
    let path = Path::new("deployments").join(deployment.id.clone() + ".js");

    path.exists()
}

async fn download_deployment(deployment: &Deployment, bucket: &Bucket) {
    let index = bucket.get_object(deployment.id.clone() + ".js").await.unwrap();

    let mut file = fs::File::create(Path::new("deployments").join(deployment.id.clone() + ".js")).unwrap();
    file.write_all(index.bytes()).unwrap();

    // TODO: download assets
}

pub fn get_deployment_code(deployment: &Deployment) -> io::Result<String> {
    let path = Path::new(env::current_dir().unwrap().as_path())
        .join("deployments")
        .join(deployment.id.clone() + ".js");
    let code = fs::read_to_string(path)?;

    Ok(code)
}
