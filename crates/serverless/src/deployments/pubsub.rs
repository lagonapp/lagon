use std::{collections::HashMap, env, sync::Arc};

use anyhow::Result;
use log::{error, info, warn};
use metrics::increment_counter;
use serde_json::Value;
use tokio::{runtime::Handle, sync::Mutex};

use crate::{
    cronjob::Cronjob,
    worker::{WorkerEvent, Workers},
    REGION,
};

use super::{
    download_deployment, downloader::Downloader, filesystem::rm_deployment, Deployment, Deployments,
};

pub async fn clear_deployment_cache(deployment_id: String, workers: Workers, reason: String) {
    for worker in workers.iter() {
        let sender = &worker.0;

        sender
            .send_async(WorkerEvent::Drop {
                deployment_id: deployment_id.clone(),
                reason: reason.clone(),
            })
            .await
            .unwrap_or(());
    }
}

async fn run<D>(
    downloader: D,
    deployments: Deployments,
    workers: Workers,
    cronjob: Arc<Mutex<Cronjob>>,
    client: &redis::Client,
) -> Result<()>
where
    D: Downloader + Send + 'static,
{
    let mut conn = client.get_connection()?;
    let mut pub_sub = conn.as_pubsub();

    info!("Redis Pub/Sub connected");

    pub_sub.subscribe("deploy")?;
    pub_sub.subscribe("undeploy")?;
    pub_sub.subscribe("promote")?;

    loop {
        let msg = pub_sub.get_message()?;
        let channel = msg.get_channel_name().to_owned();
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

        let workers = Arc::clone(&workers);

        match channel.as_str() {
            "deploy" => {
                match download_deployment(&deployment, downloader.clone()).await {
                    Ok(_) => {
                        increment_counter!(
                            "lagon_deployments",
                            "status" => "success",
                            "deployment" => deployment.id.clone(),
                            "function" => deployment.function_id.clone(),
                            "region" => REGION.clone(),
                        );

                        let domains = deployment.get_domains();
                        let deployment = Arc::new(deployment);

                        for domain in &domains {
                            deployments.insert(domain.clone(), Arc::clone(&deployment));
                        }

                        clear_deployment_cache(
                            deployment.id.clone(),
                            workers,
                            String::from("deployment"),
                        )
                        .await;

                        if deployment.should_run_cron() {
                            let mut cronjob = cronjob.lock().await;
                            let id = deployment.id.clone();

                            if let Err(error) = cronjob.add(deployment).await {
                                error!(deployment = id; "Failed to register cron: {}", error);
                            }
                        }
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

                        let domains = deployment.get_domains();

                        for domain in &domains {
                            deployments.remove(domain);
                        }

                        clear_deployment_cache(
                            deployment.id.clone(),
                            workers,
                            String::from("undeployment"),
                        )
                        .await;

                        if deployment.should_run_cron() {
                            let mut cronjob = cronjob.lock().await;

                            if let Err(error) = cronjob.remove(&deployment.id).await {
                                error!(deployment = deployment.id; "Failed to remove cron: {}", error);
                            }
                        }
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

                if let Some(deployment) = deployments.get(previous_id) {
                    let mut unpromoted_deployment = deployment.as_ref().clone();
                    unpromoted_deployment.is_production = false;

                    for domain in deployment.get_domains() {
                        deployments.remove(&domain);
                    }

                    let unpromoted_deployment = Arc::new(unpromoted_deployment);

                    for domain in unpromoted_deployment.get_domains() {
                        deployments.insert(domain, Arc::clone(&unpromoted_deployment));
                    }
                }

                let deployment = Arc::new(deployment);
                let domains = deployment.get_domains();

                for domain in &domains {
                    deployments.insert(domain.clone(), Arc::clone(&deployment));
                }

                clear_deployment_cache(deployment.id.clone(), workers, String::from("promotion"))
                    .await;

                if deployment.should_run_cron() {
                    let mut cronjob = cronjob.lock().await;
                    let id = deployment.id.clone();

                    if let Err(error) = cronjob.add(deployment).await {
                        error!(deployment = id; "Failed to register cron: {}", error);
                    }
                }
            }
            _ => warn!("Unknown channel: {}", channel),
        };
    }
}

pub fn listen_pub_sub<D>(
    downloader: D,
    deployments: Deployments,
    workers: Workers,
    cronjob: Arc<Mutex<Cronjob>>,
) where
    D: Downloader + Send + Sync + 'static,
{
    let handle = Handle::current();
    std::thread::spawn(move || {
        handle.block_on(async {
            let url = env::var("REDIS_URL").expect("REDIS_URL must be set");
            let client = redis::Client::open(url).expect("Failed to open Redis Client");

            loop {
                if let Err(error) = run(
                    downloader.clone(),
                    Arc::clone(&deployments),
                    Arc::clone(&workers),
                    Arc::clone(&cronjob),
                    &client,
                )
                .await
                {
                    error!("Pub/sub error: {}", error);
                }
            }
        });
    });
}
