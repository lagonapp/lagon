use std::{collections::HashMap, sync::Arc, time::Duration};

use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use lagon_runtime_utils::Deployment;
use log::{error, info};
use metrics::{decrement_gauge, histogram, increment_gauge};
use rand::{Rng, SeedableRng};
use tokio::sync::RwLock;
use tokio_util::task::LocalPoolHandle;

use crate::{REGION, SNAPSHOT_BLOB, WORKERS};

pub type Workers =
    Arc<RwLock<HashMap<usize, (flume::Sender<WorkerEvent>, flume::Receiver<WorkerEvent>)>>>;

pub enum WorkerEvent {
    Request {
        deployment: Arc<Deployment>,
        request: Request,
        sender: flume::Sender<RunResult>,
        labels: [(&'static str, String); 3],
        request_id: String,
    },
    Drop {
        deployment_id: String,
        reason: String,
    },
}

pub async fn create_workers() -> Workers {
    let workers = Arc::new(RwLock::new(HashMap::new()));

    for i in 0..*WORKERS {
        let worker = flume::unbounded();
        workers.write().await.insert(i, worker);
    }

    workers
}

pub async fn get_thread_id(
    thread_ids: Arc<RwLock<HashMap<String, usize>>>,
    hostname: &String,
) -> usize {
    let thread_ids_reader = thread_ids.read().await;

    let thread_id = match thread_ids_reader.get(hostname) {
        Some(thread_id) => *thread_id,
        None => {
            let mut rng = rand::rngs::StdRng::from_entropy();
            let id = rng.gen_range(0..*WORKERS);

            drop(thread_ids_reader);

            thread_ids.write().await.insert(hostname.clone(), id);
            id
        }
    };

    thread_id
}

pub async fn start_workers(workers: Workers) {
    let pool = LocalPoolHandle::new(*WORKERS);

    for (id, worker) in workers.read().await.iter() {
        let id = *id;
        let receiver = worker.1.clone();

        pool.spawn_pinned_by_idx(
            move || async move {
                let mut isolates = HashMap::new();

                loop {
                    match receiver.recv_async().await {
                        Ok(WorkerEvent::Request { deployment, request, sender, labels, request_id }) => {
                            let deployment_id = deployment.id.clone();

                            let isolate = isolates.entry(deployment_id.clone()).or_insert_with(|| {
                                increment_gauge!("lagon_isolates", 1.0, &labels);
                                info!(deployment = deployment.id, function = deployment.function_id, request = request_id; "Creating new isolate");

                                let code = deployment.get_code().unwrap_or_else(|error| {
                                    error!(deployment = deployment.id, request = request_id; "Error while getting deployment code: {}", error);

                                    "".into()
                                });
                                let options = IsolateOptions::new(code)
                                    .environment_variables(deployment.environment_variables.clone())
                                    .memory(deployment.memory)
                                    .timeout(Duration::from_millis(deployment.timeout as u64))
                                    .startup_timeout(Duration::from_millis(
                                        deployment.startup_timeout as u64,
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
                                    }))
                                    .snapshot_blob(SNAPSHOT_BLOB);

                                Isolate::new(options)
                            });

                            isolate.run(request, sender).await;
                        },
                        Ok(WorkerEvent::Drop { deployment_id, reason }) => {
                            if let Some(isolate) = isolates.remove(&deployment_id) {
                                let metadata = isolate.get_metadata();

                                if let Some((deployment, function)) = metadata.as_ref() {
                                    info!(
                                        deployment = deployment,
                                        function = function;
                                        "Clearing deployment from cache due to {}",
                                        reason,
                                    );
                                }
                            }
                        },
                        _ => {},
                    }
                }
            },
            id,
        );
    }
}
