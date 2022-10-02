use std::{collections::HashMap, sync::Arc};

use log::error;
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
                function_id: value["functionId"].as_str().unwrap().to_string(),
                function_name: value["functionName"].as_str().unwrap().to_string(),
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
                environment_variables: value["env"]
                    .as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, v)| (k.to_owned(), v.as_str().unwrap().to_string()))
                    .collect::<HashMap<_, _>>(),
                memory: value["memory"].as_u64().unwrap() as usize,
                timeout: value["timeout"].as_u64().unwrap() as usize,
            };

            match channel {
                "deploy" => {
                    match download_deployment(&deployment, &bucket).await {
                        Ok(_) => {
                            let mut deployments = deployments.write().await;

                            for domain in deployment.get_domains() {
                                deployments.insert(domain, deployment.clone());
                            }
                        }
                        Err(err) => {
                            error!(
                                "Failed to download deployment ({}): {:?}",
                                deployment.id, err
                            );
                        }
                    };
                }
                "undeploy" => {
                    match rm_deployment(&deployment.id) {
                        Ok(_) => {
                            let mut deployments = deployments.write().await;

                            for domain in deployment.get_domains() {
                                deployments.remove(&domain);
                            }
                        }
                        Err(err) => {
                            error!("Failed to delete deployment ({}): {:?}", deployment.id, err);
                        }
                    };
                }
                _ => error!("Unknown channel: {}", channel),
            };
        }
    })
}
