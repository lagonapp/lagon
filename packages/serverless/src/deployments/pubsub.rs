use std::{collections::HashMap, sync::Arc};

use anyhow::Result;
use log::error;
use s3::Bucket;
use serde_json::Value;
use tokio::{sync::RwLock, task::JoinHandle};

use crate::ISOLATES;

use super::{download_deployment, filesystem::rm_deployment, Deployment};

async fn clear_deployments_cache(domains: &Vec<String>) {
    let mut isolates = ISOLATES.write().await;
    isolates
        .iter_mut()
        .for_each(|(_thread_id, thread_isolates)| {
            for domain in domains {
                thread_isolates.remove(domain);
            }
        })
}

pub fn listen_pub_sub(
    bucket: Bucket,
    deployments: Arc<RwLock<HashMap<String, Deployment>>>,
) -> JoinHandle<Result<()>> {
    tokio::spawn(async move {
        let url = dotenv::var("REDIS_URL").expect("REDIS_URL must be set");
        let client = redis::Client::open(url)?;
        let mut conn = client.get_connection()?;
        let mut pub_sub = conn.as_pubsub();

        pub_sub.subscribe("deploy")?;
        pub_sub.subscribe("undeploy")?;
        pub_sub.subscribe("promote")?;
        // TODO: domains

        loop {
            let msg = pub_sub.get_message()?;
            let channel = msg.get_channel_name();
            let payload: String = msg.get_payload()?;

            let value: Value = serde_json::from_str(&payload)?;

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
                is_production: value["isProduction"].as_bool().unwrap(),
            };

            match channel {
                "deploy" => {
                    match download_deployment(&deployment, &bucket).await {
                        Ok(_) => {
                            let mut deployments = deployments.write().await;
                            let domains = deployment.get_domains();

                            for domain in &domains {
                                deployments.insert(domain.clone(), deployment.clone());
                            }

                            clear_deployments_cache(&domains).await;
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
                            let domains = deployment.get_domains();

                            for domain in &domains {
                                deployments.remove(domain);
                            }

                            clear_deployments_cache(&domains).await;
                        }
                        Err(err) => {
                            error!("Failed to delete deployment ({}): {:?}", deployment.id, err);
                        }
                    };
                }
                "promote" => {
                    let previous_id = value["previousDeploymentId"].as_str().unwrap();
                    let mut deployments = deployments.write().await;

                    if let Some(deployment) = deployments.get(previous_id) {
                        let mut unpromoted_deployment = deployment.clone();
                        unpromoted_deployment.is_production = false;

                        for domain in deployment.get_domains() {
                            deployments.remove(&domain);
                        }

                        for domain in unpromoted_deployment.get_domains() {
                            deployments.insert(domain, unpromoted_deployment.clone());
                        }
                    }

                    let domains = deployment.get_domains();

                    for domain in &domains {
                        deployments.insert(domain.clone(), deployment.clone());
                    }

                    clear_deployments_cache(&domains).await;
                }
                _ => error!("Unknown channel: {}", channel),
            };
        }
    })
}
