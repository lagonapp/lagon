use super::{
    download_deployment, downloader::Downloader, filesystem::rm_deployment, Deployment, Deployments,
};
use crate::{
    cronjob::Cronjob,
    worker::{WorkerEvent, Workers},
    REGION,
};
use anyhow::Result;
use async_trait::async_trait;
use futures::{Stream, StreamExt};
use log::{error, warn};
use metrics::increment_counter;
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};
use tokio::{runtime::Handle, sync::Mutex};

mod fake;
mod redis;

pub use self::redis::RedisPubSub;
pub use fake::FakePubSub;

#[derive(Debug)]
pub enum PubSubMessageKind {
    Deploy,
    Undeploy,
    Promote,
    Unknown,
}

pub struct PubSubMessage {
    kind: PubSubMessageKind,
    payload: String,
}

impl PubSubMessage {
    pub fn new(kind: PubSubMessageKind, payload: String) -> Self {
        Self { kind, payload }
    }
}

impl From<String> for PubSubMessageKind {
    fn from(value: String) -> Self {
        match value.as_str() {
            "deploy" => Self::Deploy,
            "undeploy" => Self::Undeploy,
            "promote" => Self::Promote,
            _ => Self::Unknown,
        }
    }
}

#[async_trait]
pub trait PubSubListener: Send + Sized {
    async fn connect(&mut self) -> Result<()>;

    fn get_stream(&mut self) -> Box<dyn Stream<Item = PubSubMessage> + Unpin + Send + '_>;
}

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

async fn run<D, P>(
    downloader: Arc<D>,
    deployments: Deployments,
    workers: Workers,
    cronjob: Arc<Mutex<Cronjob>>,
    pubsub: Arc<Mutex<P>>,
) -> Result<()>
where
    D: Downloader + Send + 'static,
    P: PubSubListener + Unpin + Send,
{
    let mut pubsub = pubsub.lock().await;
    pubsub.connect().await?;

    let mut stream = pubsub.get_stream();

    while let Some(PubSubMessage { kind, payload }) = stream.next().await {
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

        match kind {
            PubSubMessageKind::Deploy => {
                match download_deployment(&deployment, Arc::clone(&downloader)).await {
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
            PubSubMessageKind::Undeploy => {
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
            PubSubMessageKind::Promote => {
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
            _ => warn!("Unknown message kind: {:?}, {}", kind, payload),
        };
    }

    Ok(())
}

pub fn listen_pub_sub<D, P>(
    downloader: Arc<D>,
    deployments: Deployments,
    workers: Workers,
    cronjob: Arc<Mutex<Cronjob>>,
    pubsub: Arc<Mutex<P>>,
) where
    D: Downloader + Send + Sync + 'static,
    P: PubSubListener + Unpin + Send + 'static,
{
    let handle = Handle::current();
    std::thread::spawn(move || {
        handle.block_on(async {
            loop {
                if let Err(error) = run(
                    Arc::clone(&downloader),
                    Arc::clone(&deployments),
                    Arc::clone(&workers),
                    Arc::clone(&cronjob),
                    Arc::clone(&pubsub),
                )
                .await
                {
                    error!("Pub/sub error: {}", error);
                }
            }
        });
    });
}
