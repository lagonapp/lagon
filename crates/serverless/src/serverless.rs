use crate::{
    clickhouse::{LogRow, RequestRow},
    deployments::{cache::run_cache_clear_task, pubsub::listen_pub_sub, Deployments},
    REGION, SNAPSHOT_BLOB,
};
use anyhow::Result;
use clickhouse::{inserter::Inserter, Client};
use dashmap::DashMap;
use hyper::{
    header::HOST,
    http::response::Builder,
    server::conn::AddrStream,
    service::{make_service_fn, service_fn},
    Body, Request as HyperRequest, Response as HyperResponse, Server,
};
use lagon_runtime_http::{
    Request, Response, RunResult, X_FORWARDED_FOR, X_LAGON_ID, X_LAGON_REGION, X_REAL_IP,
};
use lagon_runtime_isolate::{
    options::{IsolateOptions, Metadata},
    Isolate, IsolateEvent, IsolateRequest,
};
use lagon_runtime_utils::{
    assets::{find_asset, handle_asset},
    response::{handle_response, ResponseEvent, FAVICON_URL, PAGE_403, PAGE_404},
    DEPLOYMENTS_DIR,
};
use lagon_serverless_downloader::Downloader;
use lagon_serverless_pubsub::PubSubListener;
use log::{as_debug, error, info, warn};
use metrics::{decrement_gauge, histogram, increment_counter, increment_gauge};
use std::{
    convert::Infallible,
    env,
    future::Future,
    net::SocketAddr,
    path::Path,
    sync::Arc,
    time::{Duration, Instant, UNIX_EPOCH},
};
use tokio::{runtime::Handle, sync::Mutex};

pub type Workers = Arc<DashMap<String, flume::Sender<IsolateEvent>>>;

fn handle_error(
    result: RunResult,
    deployment_id: &String,
    request_id: &String,
    labels: &[(&'static str, String); 3],
) {
    match result {
        RunResult::Timeout => {
            increment_counter!("lagon_isolate_timeouts", labels);
            warn!(deployment = deployment_id, request = request_id; "Function execution timed out")
        }
        RunResult::MemoryLimit => {
            increment_counter!("lagon_isolate_memory_limits", labels);
            warn!(deployment = deployment_id, request = request_id; "Function execution memory limit reached")
        }
        RunResult::Error(error) => {
            increment_counter!("lagon_isolate_errors", labels);
            error!(deployment = deployment_id, request = request_id; "Function execution error: {}", error);
        }
        _ => {}
    };
}

async fn handle_request(
    req: HyperRequest<Body>,
    ip: String,
    deployments: Deployments,
    last_requests: Arc<DashMap<String, Instant>>,
    workers: Workers,
    inserters: Arc<Mutex<(Inserter<RequestRow>, Inserter<LogRow>)>>,
    log_sender: flume::Sender<(String, String, Metadata)>,
) -> Result<HyperResponse<Body>> {
    let request_id = match req.headers().get(X_LAGON_ID) {
        Some(x_lagon_id) => x_lagon_id.to_str().unwrap_or("").to_string(),
        None => String::new(),
    };

    let hostname = match req.headers().get(HOST) {
        Some(hostname) => hostname.to_str()?.to_string(),
        None => {
            increment_counter!(
                "lagon_ignored_requests",
                "reason" => "No hostname",
                "region" => REGION.clone(),
            );
            warn!(req = as_debug!(req), ip = ip, request = request_id; "No Host header found in request");

            return Ok(Builder::new().status(404).body(PAGE_404.into())?);
        }
    };

    let deployment = match deployments.get(&hostname) {
        Some(entry) => Arc::clone(entry.value()),
        None => {
            increment_counter!(
                "lagon_ignored_requests",
                "reason" => "No deployment",
                "hostname" => hostname.clone(),
                "region" => REGION.clone(),
            );
            warn!(req = as_debug!(req), ip = ip, hostname = hostname, request = request_id; "No deployment found for hostname");

            return Ok(HyperResponse::builder().status(404).body(PAGE_404.into())?);
        }
    };

    if deployment.cron.is_some() {
        increment_counter!(
            "lagon_ignored_requests",
            "reason" => "Cron",
            "hostname" => hostname.clone(),
            "region" => REGION.clone(),
        );
        warn!(req = as_debug!(req), ip = ip, hostname = hostname, request = request_id; "Cron deployment cannot be called directly");

        return Ok(HyperResponse::builder().status(403).body(PAGE_403.into())?);
    }

    let function_id = deployment.function_id.clone();
    let deployment_id = deployment.id.clone();
    let mut bytes_in = 0;

    let request_id_handle = request_id.clone();

    let (sender, receiver) = flume::unbounded();

    let labels = [
        ("deployment", deployment.id.clone()),
        ("function", deployment.function_id.clone()),
        ("region", REGION.clone()),
    ];

    let url = req.uri().path();
    let is_favicon = url == FAVICON_URL;

    if let Some(asset) = find_asset(url, &deployment.assets) {
        let root = Path::new(env::current_dir().unwrap().as_path())
            .join(DEPLOYMENTS_DIR)
            .join(&deployment.id);

        let run_result = match handle_asset(root, asset) {
            Ok(response) => RunResult::Response(response, None),
            Err(error) => {
                error!(deployment = &deployment.id, asset = asset, request = request_id; "Error while handing asset: {}", error);

                RunResult::Error("Could not retrieve asset.".into())
            }
        };

        sender.send_async(run_result).await.unwrap_or(());
    } else if is_favicon {
        sender
            .send_async(RunResult::Response(
                Response {
                    status: 404,
                    ..Default::default()
                },
                None,
            ))
            .await
            .unwrap_or(());
    } else {
        last_requests.insert(deployment_id.clone(), Instant::now());

        match Request::from_hyper_with_capacity(req, 2).await {
            Ok(mut request) => {
                bytes_in = request.len() as u32;

                // Try to Extract the X-Real-Ip header or fallback to remote addr IP
                let ip = request
                    .headers
                    .as_ref()
                    .map_or(&ip, |headers| {
                        headers
                            .get(X_REAL_IP)
                            .map_or(&ip, |x_real_ip| x_real_ip.get(0).unwrap_or(&ip))
                    })
                    .to_string();

                request.set_header(X_FORWARDED_FOR.to_string(), ip);
                request.set_header(X_LAGON_REGION.to_string(), REGION.to_string());

                let isolate_workers = Arc::clone(&workers);
                let isolate_sender = workers.entry(deployment_id.clone()).or_insert_with(|| {
                    let handle = Handle::current();
                    let (sender, receiver) = flume::unbounded();
                    let labels = labels.clone();

                    std::thread::Builder::new().name(String::from("isolate-") + deployment.id.as_str()).spawn(move || {
                        handle.block_on(async move {
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

                                        histogram!(
                                            "lagon_isolate_memory_usage",
                                            statistics as f64,
                                            &labels
                                        );
                                    }
                                }))
                                .log_sender(log_sender)
                                .snapshot_blob(SNAPSHOT_BLOB);

                            let mut isolate = Isolate::new(options, receiver);
                            isolate.evaluate();
                            isolate.run_event_loop().await;

                            // When the event loop is completed, that means a) the isolate was terminate due to limits
                            // or b) the isolate was dropped because of cache expiration. In the first case, the isolate
                            // isn't removed from the workers map
                            isolate_workers.remove(&deployment.id);
                        });
                    }).unwrap();

                    sender
                });

                isolate_sender
                    .send_async(IsolateEvent::Request(IsolateRequest { request, sender }))
                    .await
                    .unwrap_or(());
            }
            Err(error) => {
                error!(deployment = &deployment.id, request = request_id; "Error while parsing request: {}", error);

                sender
                    .send_async(RunResult::Error("Error while parsing request".into()))
                    .await
                    .unwrap_or(());
            }
        }
    }

    handle_response(
        receiver,
        (
            function_id,
            deployment_id,
            bytes_in,
            request_id_handle,
            labels,
            inserters,
        ),
        Box::new(
            |event, (function_id, deployment_id, bytes_in, request_id, labels, inserters)| {
                Box::pin(async move {
                    match event {
                        ResponseEvent::Bytes(bytes, cpu_time_micros) => {
                            inserters
                                .lock()
                                .await
                                .0
                                .write(&RequestRow {
                                    function_id,
                                    deployment_id,
                                    region: REGION.clone(),
                                    bytes_in,
                                    bytes_out: bytes as u32,
                                    cpu_time_micros,
                                    timestamp: UNIX_EPOCH.elapsed().unwrap().as_secs() as u32,
                                })
                                .await?;
                        }
                        ResponseEvent::StreamDoneNoDataError => {
                            handle_error(
                                RunResult::Error(
                                    "The stream was done before sending a response/data".into(),
                                ),
                                &deployment_id,
                                &request_id,
                                &labels,
                            );
                        }
                        ResponseEvent::UnexpectedStreamResult(result)
                        | ResponseEvent::LimitsReached(result)
                        | ResponseEvent::Error(result) => {
                            handle_error(result, &deployment_id, &request_id, &labels);
                        }
                    }

                    Ok(())
                })
            },
        ),
    )
    .await
}

pub async fn start<D, P>(
    deployments: Deployments,
    addr: SocketAddr,
    downloader: Arc<D>,
    pubsub: P,
    client: Client,
    // cronjob: Arc<Mutex<Cronjob>>,
) -> Result<impl Future<Output = ()> + Send>
where
    D: Downloader + Send + Sync + 'static,
    P: PubSubListener + Unpin + 'static,
{
    let last_requests = Arc::new(DashMap::new());

    let workers = Arc::new(DashMap::new());
    let pubsub = Arc::new(Mutex::new(pubsub));

    listen_pub_sub(
        Arc::clone(&downloader),
        Arc::clone(&deployments),
        Arc::clone(&workers),
        // Arc::clone(&cronjob),
        pubsub,
    );
    run_cache_clear_task(Arc::clone(&last_requests), Arc::clone(&workers));

    let insertion_interval = Duration::from_secs(1);
    let inserters = Arc::new(Mutex::new((
        client
            .inserter::<RequestRow>("serverless.requests")?
            .with_period(Some(insertion_interval)),
        client
            .inserter::<LogRow>("serverless.logs")?
            .with_period(Some(insertion_interval)),
    )));

    let inserters_handle = Arc::clone(&inserters);
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(insertion_interval).await;

            let mut inserters = inserters_handle.lock().await;

            if let Err(error) = inserters.0.commit().await {
                error!("Error while committing requests: {}", error);
            }

            if let Err(error) = inserters.1.commit().await {
                error!("Error while committing logs: {}", error);
            }
        }
    });

    let (log_sender, log_receiver) = flume::unbounded::<(String, String, Metadata)>();
    let inserters_handle = Arc::clone(&inserters);
    tokio::spawn(async move {
        while let Ok(log) = log_receiver.recv_async().await {
            let mut inserters = inserters_handle.lock().await;

            if let Err(error) = inserters
                .1
                .write(&LogRow {
                    function_id: log
                        .2
                        .as_ref()
                        .map_or_else(String::new, |metadata| metadata.1.clone()),
                    deployment_id: log
                        .2
                        .as_ref()
                        .map_or_else(String::new, |metadata| metadata.0.clone()),
                    level: log.0,
                    message: log.1,
                    region: REGION.clone(),
                    timestamp: UNIX_EPOCH.elapsed().unwrap().as_secs() as u32,
                })
                .await
            {
                error!("Error while writing log: {}", error);
            }
        }
    });

    let server = Server::bind(&addr).serve(make_service_fn(move |conn: &AddrStream| {
        let deployments = Arc::clone(&deployments);
        let last_requests = Arc::clone(&last_requests);
        let workers = Arc::clone(&workers);
        let inserters = Arc::clone(&inserters);
        let log_sender = log_sender.clone();

        let addr = conn.remote_addr();
        let ip = addr.ip().to_string();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(
                    req,
                    ip.clone(),
                    Arc::clone(&deployments),
                    Arc::clone(&last_requests),
                    Arc::clone(&workers),
                    Arc::clone(&inserters),
                    log_sender.clone(),
                )
            }))
        }
    }));

    Ok(async move {
        if let Err(error) = server.await {
            error!("Server error: {}", error);
        }
    })
}
