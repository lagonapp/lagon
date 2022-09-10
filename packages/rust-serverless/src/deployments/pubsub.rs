use std::{collections::HashMap, sync::Arc};

use s3::Bucket;
use serde_json::Value;
use tokio::{sync::RwLock, task::JoinHandle};

use super::{download_deployment, filesystem::rm_deployment, Deployment};

pub fn listen_pub_sub(
    bucket: Bucket,
    deployments: Arc<RwLock<HashMap<String, Deployment>>>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let url = dotenv::var("REDIS_URL").expect("REDIS_URL must be set");
        let client = redis::Client::open(url).unwrap();
        let mut conn = client.get_connection().unwrap();
        let mut pub_sub = conn.as_pubsub();

        pub_sub.subscribe("deploy").unwrap();
        pub_sub.subscribe("undeploy").unwrap();
        // TODO: current, domains

        loop {
            let msg = pub_sub.get_message().unwrap();
            let channel = msg.get_channel_name();
            let payload: String = msg.get_payload().unwrap();

            let value: Value = serde_json::from_str(&payload).unwrap();

            let deployment = Deployment {
                id: value["deploymentId"].as_str().unwrap().to_string(),
                assets: value["assets"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_str().unwrap().to_string())
                    .collect(),
                domains: value["domains"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_str().unwrap().to_string())
                    .collect(),
            };

            match channel {
                "deploy" => {
                    match download_deployment(&deployment, &bucket).await {
                        Ok(_) => {
                            let mut deployments = deployments.write().await;

                            for domain in deployment.domains.clone() {
                                deployments.insert(domain, deployment.clone());
                            }
                        }
                        Err(error) => {
                            println!("Failed to download deployment: {:?}", error);
                        }
                    };
                }
                "undeploy" => {
                    match rm_deployment(deployment.id) {
                        Ok(_) => {
                            let mut deployments = deployments.write().await;


                            for domain in deployment.domains.clone() {
                                deployments.remove(&domain);
                            }
                        }
                        Err(error) => {
                            println!("Failed to delete deployment: {:?}", error);
                        }
                    };
                }
                _ => println!("Unknown channel: {}", channel),
            };
        }
    })
}
