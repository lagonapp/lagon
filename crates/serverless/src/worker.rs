use std::{collections::HashMap, sync::Arc, time::Duration};

use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use lagon_runtime_utils::Deployment;
use log::{error, info};
use metrics::{decrement_gauge, histogram, increment_gauge};
use tokio::sync::RwLock;
use tokio_util::task::LocalPoolHandle;

use crate::{POOL_SIZE, REGION, SNAPSHOT_BLOB};

pub struct WorkerRequest {
    pub deployment: Arc<Deployment>,
    pub request: Request,
    pub sender: flume::Sender<RunResult>,
    pub labels: [(&'static str, String); 3],
    pub request_id: String,
}

pub async fn start_workers(
    workers: Arc<
        RwLock<HashMap<usize, (flume::Sender<WorkerRequest>, flume::Receiver<WorkerRequest>)>>,
    >,
) {
    tokio::spawn(async move {});
    let pool = LocalPoolHandle::new(POOL_SIZE);

    for (id, receiver) in workers.read().await.iter() {
        let id = *id;
        let receiver = receiver.1.clone();

        pool.spawn_pinned_by_idx(
            move || async move {
                let mut isolates = HashMap::new();

                loop {
                    let WorkerRequest {
                        deployment,
                        request,
                        sender,
                        labels,
                        request_id,
                    } = receiver.recv_async().await.unwrap();

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
                }
            },
            id,
        );
    }
}
