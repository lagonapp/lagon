use anyhow::Result;
use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate, CONSOLE_SOURCE};
use log::{error, info, warn};
use metrics::{decrement_gauge, histogram, increment_gauge};
use std::{collections::HashMap, sync::Arc};
use tokio_cron_scheduler::{Job, JobScheduler};
use uuid::Uuid;

use crate::{
    deployments::{filesystem::get_deployment_code, Deployment},
    REGION,
};

pub struct Cronjob {
    jobs: HashMap<String, Uuid>,
    scheduler: JobScheduler,
}

impl Cronjob {
    pub async fn new() -> Self {
        let scheduler = JobScheduler::new().await.unwrap();
        scheduler.start().await.unwrap();

        Self {
            jobs: HashMap::new(),
            scheduler,
        }
    }

    pub async fn add(&mut self, deployment: Arc<Deployment>) -> Result<()> {
        if let Some(cron) = &deployment.cron {
            // Adding a 0 at the beginning because tokio-cron-scheduler's
            // cron format include seconds at the start
            let cron = format!("0 {}", cron);

            info!("Registering cron {} for deployment {}", cron, deployment.id);

            let id = deployment.id.clone();
            let uuid = self
                .scheduler
                .add(Job::new_async(cron.as_str(), move |_, _| {
                    let labels = [
                        ("deployment", deployment.id.clone()),
                        ("function", deployment.function_id.clone()),
                        ("region", REGION.clone()),
                    ];

                    increment_gauge!("lagon_isolates", 1.0, &labels);
                    info!(deployment = deployment.id, function = deployment.function_id; "Creating new isolate");

                    let deployment = Arc::clone(&deployment);
                    let code = get_deployment_code(&deployment).unwrap_or_else(|error| {
                        error!(deployment = deployment.id; "Error while getting deployment code: {}", error);

                        "".into()
                    });

                    Box::pin(async move {
                        let options = IsolateOptions::new(code)
                            .environment_variables(deployment.environment_variables.clone())
                            .memory(deployment.memory)
                            .timeout(deployment.timeout)
                            .startup_timeout(deployment.startup_timeout)
                            .metadata(Some((deployment.id.clone(), deployment.function_id.clone())))
                            .on_drop_callback(Box::new(|metadata| {
                                if let Some(metadata) = metadata.as_ref().as_ref() {
                                    let labels = [
                                        ("deployment", metadata.0.clone()),
                                        ("function", metadata.1.clone()),
                                        ("region", REGION.clone()),
                                    ];

                                    decrement_gauge!("lagon_isolates", 1.0, &labels);
                                    info!(deployment = metadata.0, function = metadata.1; "Dropping isolate");
                                }
                            }))
                            .on_statistics_callback(Box::new(|metadata, statistics| {
                                if let Some(metadata) = metadata.as_ref().as_ref() {
                                    let labels = [
                                        ("deployment", metadata.0.clone()),
                                        ("function", metadata.1.clone()),
                                        ("region", REGION.clone()),
                                    ];

                                    histogram!("lagon_isolate_cpu_time", statistics.cpu_time, &labels);
                                    histogram!(
                                        "lagon_isolate_memory_usage",
                                        statistics.memory_usage as f64,
                                        &labels
                                    );
                                }
                            }));

                        let mut isolate = Isolate::new(options);
                        let (tx, rx) = flume::unbounded();
                        isolate.run(Request::default(), tx).await;

                        let result = rx.recv_async().await.expect("Isolate didn't send a response");

                        match result {
                            RunResult::Stream(_) => {
                                error!(source = CONSOLE_SOURCE, deployment = deployment.id, function = deployment.function_id; "Cron can't return a stream")
                            }
                            RunResult::Response(response) => {
                                let body = String::from_utf8_lossy(&response.body);
                                let maybe_body = if body == "" { String::from("") } else { format!(": {}", body) };

                                if response.status == 200 {
                                    info!(
                                        source = CONSOLE_SOURCE,
                                        deployment = deployment.id,
                                        function = deployment.function_id;
                                        "Cron execution successful{}",
                                        maybe_body,
                                    )
                                } else {
                                    error!(
                                        source = CONSOLE_SOURCE,
                                        deployment = deployment.id,
                                        function = deployment.function_id;
                                        "Cron execution failed with status {}{}",
                                        response.status,
                                        maybe_body,
                                    )
                                }
                            }
                            RunResult::Timeout => {
                                warn!(
                                    source = CONSOLE_SOURCE,
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution timed out",
                                )
                            }
                            RunResult::MemoryLimit => {
                                warn!(
                                    source = CONSOLE_SOURCE,
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution memory limit reached",
                                )
                            }
                            RunResult::Error(error) => {
                                error!(
                                    source = CONSOLE_SOURCE,
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution error: {}",
                                    error,
                                )
                            }
                            RunResult::NotFound => {}
                        }
                    })
                })?)
                .await?;

            self.jobs.insert(id, uuid);
        }

        Ok(())
    }

    pub async fn remove(&mut self, deployment_id: &String) -> Result<()> {
        if let Some(uuid) = self.jobs.remove(deployment_id) {
            info!("Unregistering cron for deployment {}", deployment_id);

            self.scheduler.remove(&uuid).await?;
        }

        Ok(())
    }
}
