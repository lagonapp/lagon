use std::{
    convert::Infallible, env, future::Future, net::SocketAddr, path::Path, sync::Arc, time::Instant,
};

use crate::{
    cronjob::Cronjob,
    deployments::{
        cache::run_cache_clear_task,
        downloader::Downloader,
        pubsub::{listen_pub_sub, PubSubListener},
        Deployments,
    },
    worker::{create_workers, get_thread_id, start_workers, WorkerEvent, Workers},
    REGION,
};
use anyhow::Result;
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
use lagon_runtime_isolate::CONSOLE_SOURCE;
use lagon_runtime_utils::{
    assets::{find_asset, handle_asset},
    response::{handle_response, ResponseEvent, FAVICON_URL, PAGE_404},
    DEPLOYMENTS_DIR,
};
use log::{as_debug, error, warn};
use metrics::{counter, increment_counter};
use tokio::sync::Mutex;

fn handle_error(
    result: RunResult,
    deployment_id: &String,
    request_id: &String,
    labels: &[(&'static str, String); 3],
) {
    match result {
        RunResult::Timeout => {
            increment_counter!("lagon_isolate_timeouts", labels);
            warn!(deployment = deployment_id, request = request_id, source = CONSOLE_SOURCE; "Function execution timed out")
        }
        RunResult::MemoryLimit => {
            increment_counter!("lagon_isolate_memory_limits", labels);
            warn!(deployment = deployment_id, request = request_id, source = CONSOLE_SOURCE; "Function execution memory limit reached")
        }
        RunResult::Error(error) => {
            increment_counter!("lagon_isolate_errors", labels);
            error!(deployment = deployment_id, request = request_id, source = CONSOLE_SOURCE; "Function execution error: {}", error);
            println!("{error:?}");
        }
        _ => {}
    };
}

async fn handle_request(
    req: HyperRequest<Body>,
    ip: String,
    deployments: Deployments,
    thread_ids: Arc<DashMap<String, usize>>,
    last_requests: Arc<DashMap<String, Instant>>,
    workers: Workers,
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

        return Ok(HyperResponse::builder().status(404).body(PAGE_404.into())?);
    }

    let deployment_id = deployment.id.clone();
    let request_id_handle = request_id.clone();

    let (sender, receiver) = flume::unbounded();

    let labels = [
        ("deployment", deployment.id.clone()),
        ("function", deployment.function_id.clone()),
        ("region", REGION.clone()),
    ];

    increment_counter!("lagon_requests", &labels);

    let url = req.uri().path();
    let is_favicon = url == FAVICON_URL;

    if let Some(asset) = find_asset(url, &deployment.assets) {
        let root = Path::new(env::current_dir().unwrap().as_path())
            .join(DEPLOYMENTS_DIR)
            .join(&deployment.id);

        let run_result = match handle_asset(root, asset) {
            Ok(response) => RunResult::Response(response),
            Err(error) => {
                error!(deployment = &deployment.id, asset = asset, request = request_id; "Error while handing asset: {}", error);

                RunResult::Error("Could not retrieve asset.".into())
            }
        };

        sender.send_async(run_result).await.unwrap_or(());
    } else if is_favicon {
        sender
            .send_async(RunResult::Response(Response {
                status: 404,
                ..Default::default()
            }))
            .await
            .unwrap_or(());
    } else {
        last_requests.insert(deployment_id.clone(), Instant::now());

        increment_counter!("lagon_isolate_requests", &labels);

        match Request::from_hyper_with_capacity(req, 2).await {
            Ok(mut request) => {
                counter!("lagon_bytes_in", request.len() as u64, &labels);

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

                let thread_id = get_thread_id(thread_ids, deployment_id.clone());
                let worker = workers.get(&thread_id).unwrap();

                worker
                    .0
                    .send_async(WorkerEvent::Request {
                        deployment,
                        request,
                        sender,
                        labels: labels.clone(),
                        request_id,
                    })
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
        (deployment_id, request_id_handle, labels),
        Box::new(|event, (deployment_id, request_id, labels)| match event {
            ResponseEvent::Bytes(bytes) => {
                counter!("lagon_bytes_out", bytes as u64, &labels);
            }
            ResponseEvent::StreamDoneNoDataError => {
                handle_error(
                    RunResult::Error("The stream was done before sending a response/data".into()),
                    &deployment_id,
                    &request_id,
                    &labels,
                );
            }
            ResponseEvent::StreamDoneDataError => {
                handle_error(
                    RunResult::Error("Got data after stream was done".into()),
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
        }),
    )
    .await
}

pub async fn start<D, P>(
    deployments: Deployments,
    addr: SocketAddr,
    downloader: D,
    pubsub: P,
    cronjob: Arc<Mutex<Cronjob>>,
) -> Result<impl Future<Output = ()> + Send>
where
    D: Downloader + Send + 'static,
    P: PubSubListener + Unpin + 'static,
{
    let last_requests = Arc::new(DashMap::new());
    let thread_ids = Arc::new(DashMap::new());

    let workers = create_workers();
    start_workers(Arc::clone(&workers)).await;

    let pubsub = Arc::new(Mutex::new(pubsub));

    listen_pub_sub(
        downloader.clone(),
        Arc::clone(&deployments),
        Arc::clone(&workers),
        Arc::clone(&cronjob),
        pubsub,
    );
    run_cache_clear_task(Arc::clone(&last_requests), Arc::clone(&workers));

    let server = Server::bind(&addr).serve(make_service_fn(move |conn: &AddrStream| {
        let deployments = Arc::clone(&deployments);
        let thread_ids = Arc::clone(&thread_ids);
        let last_requests = Arc::clone(&last_requests);
        let workers = Arc::clone(&workers);

        let addr = conn.remote_addr();
        let ip = addr.ip().to_string();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(
                    req,
                    ip.clone(),
                    Arc::clone(&deployments),
                    Arc::clone(&thread_ids),
                    Arc::clone(&last_requests),
                    Arc::clone(&workers),
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
