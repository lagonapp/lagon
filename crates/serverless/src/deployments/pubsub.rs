use std::{collections::HashMap, env, sync::Arc};

use anyhow::Result;
use log::{error, info, warn};
use metrics::increment_counter;
use s3::Bucket;
use serde_json::Value;
use tokio::{sync::RwLock, task::JoinHandle};
use tokio_util::task::LocalPoolHandle;

use crate::{cronjob::Cronjob, ISOLATES, POOL_SIZE, REGION};

use super::{filesystem::rm_deployment, Deployment};

// The isolate is implicitely dropped when the block after `remove()` ends
//
// An isolate must be dropped (which will call `exit()` and terminate the
// execution) in the same thread as it was created in
pub async fn clear_deployments_cache(
    hostnames: Vec<String>,
    pool: &LocalPoolHandle,
    reason: &'static str,
) {
    for thread_id in 0..POOL_SIZE {
        let hostnames = hostnames.clone();

        // Spawn early the task and loop the hostnames inside, instead
        // of looping outside and spawning hostnames * threads tasks
        match pool
            .spawn_pinned_by_idx(
                move || async move {
                    let mut thread_isolates = ISOLATES.write().await;

                    for hostname in hostnames {
                        // We might not have yet created the isolates map for this thread
                        if let Some(thread_isolates) = thread_isolates.get_mut(&thread_id) {
                            if let Some(isolate) = thread_isolates.remove(&hostname) {
                                let metadata = isolate.get_metadata();

                                if let Some((deployment, function)) = metadata.as_ref() {
                                    info!(
                                        deployment = deployment,
                                        function = function,
                                        hostname = hostname;
                                        "Clearing deployment from cache due to {}",
                                        reason
                                    );
                                }
                            } else {
                                warn!(hostname = hostname; "Could not clear deployment from cache");
                            }
                        }
                    }
                },
                thread_id,
            )
            .await
        {
            Ok(_) => {}
            Err(err) => {
                error!("Failed to clear deployments from cache: {}", err);
            }
        };
    }
}

pub fn listen_pub_sub(
    bucket: Bucket,
    deployments: Arc<RwLock<HashMap<String, Arc<Deployment>>>>,
    pool: LocalPoolHandle,
    cronjob: &mut Cronjob,
) -> JoinHandle<Result<()>> {
    tokio::spawn(async move {
        let url = env::var("REDIS_URL").expect("REDIS_URL must be set");
        let client = redis::Client::open(url)?;
        let mut conn = client.get_connection()?;
        let mut pub_sub = conn.as_pubsub();

        pub_sub.subscribe("deploy")?;
        pub_sub.subscribe("undeploy")?;
        pub_sub.subscribe("promote")?;

        loop {
            let msg = pub_sub.get_message()?;
            let channel = msg.get_channel_name();
            let payload: String = msg.get_payload()?;

            let value: Value = serde_json::from_str(&payload)?;

            let cron = value["cron"].as_str();
            let cron_region = value["cronRegion"].as_str().unwrap().to_string();

            // Ignore deployments that have a cron set but where
            // the region isn't this node' region
            if cron.is_some() && cron_region != REGION.to_string() {
                continue;
            }

            let cron = cron.map(|cron| cron.to_string());

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
                startup_timeout: value["startupTimeout"].as_u64().unwrap() as usize,
                is_production: value["isProduction"].as_bool().unwrap(),
                cron,
            };

            match channel {
                "deploy" => {
                    match deployment.download(&bucket).await {
                        Ok(_) => {
                            increment_counter!(
                                "lagon_deployments",
                                "status" => "success",
                                "deployment" => deployment.id.clone(),
                                "function" => deployment.function_id.clone(),
                                "region" => REGION.clone(),
                            );

                            let mut deployments = deployments.write().await;
                            let domains = deployment.get_domains();

                            for domain in &domains {
                                deployments.insert(domain.clone(), Arc::new(deployment.clone()));
                            }

                            clear_deployments_cache(domains, &pool, "deployment").await;
                        }
                        Err(error) => {
                            increment_counter!(
                                "lagon_deployments",
                                "status" => "error",
                                "deployment" => deployment.id.clone(),
                                "function" => deployment.function_id.clone(),
                                "region" => REGION.clone(),
                            );
                            error!(
                                deployment = deployment.id;
                                "Failed to download deployment: {}", error
                            );
                        }
                    };
                }
                "undeploy" => {
                    match rm_deployment(&deployment.id) {
                        Ok(_) => {
                            increment_counter!(
                                "lagon_undeployments",
                                "status" => "success",
                                "deployment" => deployment.id.clone(),
                                "function" => deployment.function_id.clone(),
                                "region" => REGION.clone(),
                            );

                            let mut deployments = deployments.write().await;
                            let domains = deployment.get_domains();

                            for domain in &domains {
                                deployments.remove(domain);
                            }

                            clear_deployments_cache(domains, &pool, "undeployment").await;
                        }
                        Err(error) => {
                            increment_counter!(
                                "lagon_undeployments",
                                "status" => "error",
                                "deployment" => deployment.id.clone(),
                                "function" => deployment.function_id.clone(),
                                "region" => REGION.clone(),
                            );
                            error!(deployment = deployment.id; "Failed to delete deployment: {}", error);
                        }
                    };
                }
                "promote" => {
                    increment_counter!(
                        "lagon_promotion",
                        "deployment" => deployment.id.clone(),
                        "function" => deployment.function_id.clone(),
                        "region" => REGION.clone(),
                    );

                    let previous_id = value["previousDeploymentId"].as_str().unwrap();
                    let mut deployments = deployments.write().await;

                    if let Some(deployment) = deployments.get(previous_id) {
                        let mut unpromoted_deployment = deployment.as_ref().clone();
                        unpromoted_deployment.is_production = false;

                        for domain in deployment.get_domains() {
                            deployments.remove(&domain);
                        }

                        for domain in unpromoted_deployment.get_domains() {
                            deployments.insert(domain, Arc::new(unpromoted_deployment.clone()));
                        }
                    }

                    let domains = deployment.get_domains();

                    for domain in &domains {
                        deployments.insert(domain.clone(), Arc::new(deployment.clone()));
                    }

                    clear_deployments_cache(domains, &pool, "promotion").await;
                }
                _ => warn!("Unknown channel: {}", channel),
            };
        }
    })
}
