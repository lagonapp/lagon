use anyhow::Result;
use bytes::Bytes;
use clickhouse::inserter::Inserter;
use futures::lock::Mutex;
use hyper::{body, Request};
use lagon_runtime_http::RunResult;
use lagon_runtime_isolate::{
    options::{IsolateOptions, Metadata},
    Isolate, IsolateEvent, IsolateRequest,
};
use lagon_runtime_utils::Deployment;
use log::{error, info, warn};
use metrics::{decrement_gauge, histogram, increment_gauge};
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, UNIX_EPOCH},
};
use tokio::runtime::Handle;
use tokio_cron_scheduler::{Job, JobScheduler};
use uuid::Uuid;

use crate::{
    clickhouse::{LogRow, RequestRow},
    get_region, SNAPSHOT_BLOB,
};

pub struct Cronjob {
    jobs: HashMap<String, Uuid>,
    scheduler: JobScheduler,
    log_sender: flume::Sender<(String, String, Metadata)>,
    inserters: Arc<Mutex<(Inserter<RequestRow>, Inserter<LogRow>)>>,
}

impl Cronjob {
    pub async fn new(
        log_sender: flume::Sender<(String, String, Metadata)>,
        inserters: Arc<Mutex<(Inserter<RequestRow>, Inserter<LogRow>)>>,
    ) -> Self {
        let scheduler = JobScheduler::new().await.unwrap();
        scheduler.start().await.unwrap();

        Self {
            jobs: HashMap::new(),
            scheduler,
            log_sender,
            inserters,
        }
    }

    pub async fn add(&mut self, deployment: Arc<Deployment>) -> Result<()> {
        if let Some(cron) = &deployment.cron {
            // Adding a 0 at the beginning because tokio-cron-scheduler's
            // cron format include seconds at the start
            let cron = format!("0 {cron}");

            info!("Registering cron {} for deployment {}", cron, deployment.id);

            let id = deployment.id.clone();
            let inserters = self.inserters.clone();
            let log_sender = self.log_sender.clone();

            let uuid = self
                .scheduler
                .add(Job::new_async(cron.as_str(), move |_, _| {
                    let labels = [
                        ("deployment", deployment.id.clone()),
                        ("function", deployment.function_id.clone()),
                    ];

                    let deployment = Arc::clone(&deployment);
                    let inserters = Arc::clone(&inserters);
                    let log_sender = log_sender.clone();
                    let code = deployment.get_code().unwrap_or_else(|error| {
                        error!(deployment = deployment.id; "Error while getting deployment code: {}", error);

                        "".into()
                    });

                    Box::pin(async move {
                        let handle = Handle::current();
                        let (isolate_sender, isolate_receiver) = flume::unbounded();
                        let log_sender_handle = log_sender.clone();
                        let deployment_handle = Arc::clone(&deployment);

                        std::thread::Builder::new().name(String::from("cron-") + deployment.id.as_str()).spawn(move || {
                            handle.block_on(async move {
                                let deployment  = deployment_handle;

                                increment_gauge!("lagon_isolates", 1.0, &labels);
                                info!(deployment = deployment.id.clone(), function = deployment.function_id.clone(); "Creating new cron isolate");

                                let options = IsolateOptions::new(code)
                                    .environment_variables(deployment.environment_variables.clone())
                                    .memory(deployment.memory)
                                    .tick_timeout(Duration::from_millis(deployment.tick_timeout as u64))
                                    .total_timeout(Duration::from_millis(
                                        deployment.total_timeout as u64,
                                    ))
                                    .metadata(Some((
                                        deployment.id.clone(),
                                        deployment.function_id.clone(),
                                    )))
                                    .on_drop_callback(Box::new(|metadata| {
                                        if let Some(metadata) = metadata.as_ref().as_ref() {
                                            let labels = [
                                                ("deployment", metadata.0.clone()),
                                                ("function", metadata.1.clone()),
                                            ];

                                            decrement_gauge!("lagon_isolates", 1.0, &labels);
                                            info!(deployment = metadata.0, function = metadata.1; "Dropping cron isolate");
                                        }
                                    }))
                                    .on_statistics_callback(Box::new(|metadata, statistics| {
                                        if let Some(metadata) = metadata.as_ref().as_ref() {
                                            let labels = [
                                                ("deployment", metadata.0.clone()),
                                                ("function", metadata.1.clone()),
                                            ];

                                            histogram!(
                                                "lagon_isolate_memory_usage",
                                                statistics as f64,
                                                &labels
                                            );
                                        }
                                    }))
                                    .log_sender(log_sender_handle)
                                    .snapshot_blob(SNAPSHOT_BLOB);

                                let mut isolate = Isolate::new(options, isolate_receiver);
                                isolate.evaluate();
                                isolate.run_event_loop().await;
                            });
                        }).unwrap();

                        let (sender, receiver) = flume::unbounded();
                        let request = Request::new(Bytes::new()).into_parts();

                        isolate_sender.send_async(IsolateEvent::Request(IsolateRequest {
                            sender,
                            request,
                        })).await.unwrap_or(());

                        let run_result = receiver.recv_async().await.expect("Isolate didn't send a response");

                        isolate_sender.send_async(IsolateEvent::Terminate(String::from("Cron completed"))).await.unwrap_or(());

                        let (level, message) = match run_result {
                            RunResult::Stream(_) => {
                                warn!(
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron Functions can't return a stream",
                                );

                                (String::from("warn"), String::from("Cron Functions can't return a stream"))
                            }
                            RunResult::Response(response, elapsed) => {
                                let status = response.status();
                                let body = body::to_bytes(response.into_body()).await.unwrap_or_else(|error| {
                                    error!(
                                        deployment = deployment.id,
                                        function = deployment.function_id;
                                        "Error while reading response body: {}", error,
                                    );

                                    Bytes::new()
                                });

                                let timestamp = UNIX_EPOCH.elapsed().unwrap().as_secs() as u32;

                                inserters
                                    .lock()
                                    .await
                                    .0
                                    .write(&RequestRow {
                                        function_id: deployment.function_id.clone(),
                                        deployment_id: deployment.id.clone(),
                                        region: get_region().clone(),
                                        bytes_in: 0,
                                        bytes_out: 0,
                                        cpu_time_micros: elapsed.map(|duration| duration.as_micros()),
                                        timestamp,
                                    })
                                    .await
                                    .unwrap_or(());

                                let body = String::from_utf8_lossy(&body);
                                let maybe_body = if body == "" { String::from("") } else { format!(": {body}") };

                                if status == 200 {
                                    info!(
                                        deployment = deployment.id,
                                        function = deployment.function_id;
                                        "Cron execution successful{}",
                                        maybe_body,
                                    );

                                    (String::from("info"), format!("Cron execution successful{}", maybe_body))
                                } else {

                                    error!(
                                        deployment = deployment.id,
                                        function = deployment.function_id;
                                        "Cron execution failed with status {}{}",
                                        status,
                                        maybe_body,
                                    );

                                    (String::from("error"), format!("Cron execution failed with status {}{}", status, maybe_body))
                                }
                            }
                            RunResult::Timeout => {
                                warn!(
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution timed out",
                                );

                                (String::from("warn"), String::from("Cron execution timed out"))
                            }
                            RunResult::MemoryLimit => {
                                warn!(
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution memory limit reached",
                                );

                                (String::from("warn"), String::from("Cron execution memory limit reached"))
                            }
                            RunResult::Error(error) => {
                                error!(
                                    deployment = deployment.id,
                                    function = deployment.function_id;
                                    "Cron execution error: {}",
                                    error,
                                );

                                (String::from("error"), format!("Cron execution error: {}", error))
                            }
                        };

                        log_sender.send_async((level, message, Some((
                            deployment.id.clone(),
                            deployment.function_id.clone(),
                        )))).await.unwrap_or(());
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
