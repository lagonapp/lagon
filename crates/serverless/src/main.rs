use anyhow::Result;
use cronjob::Cronjob;
use deployments::cache::run_cache_clear_task;
use hyper::header::HOST;
use hyper::http::response::Builder;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{
    Request, Response, RunResult, X_FORWARDED_FOR, X_LAGON_ID, X_LAGON_REGION, X_REAL_IP,
};
use lagon_runtime_utils::response::{handle_response, ResponseEvent, FAVICON_URL, PAGE_404};
use lagon_runtime_utils::{
    assets::{find_asset, handle_asset},
    Deployment,
};
use lagon_serverless_logger::init_logger;
use lazy_static::lazy_static;
use log::{as_debug, error, info, warn};
use metrics::{counter, increment_counter};
use metrics_exporter_prometheus::PrometheusBuilder;
use mysql::{Opts, Pool};
#[cfg(not(debug_assertions))]
use mysql::{OptsBuilder, SslOpts};
use rand::prelude::*;
use s3::creds::Credentials;
use s3::Bucket;
#[cfg(not(debug_assertions))]
use std::borrow::Cow;
use std::collections::HashMap;
use std::convert::Infallible;
use std::env;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::{Mutex, RwLock};
use worker::{start_workers, Workers};

use crate::deployments::get_deployments;
use crate::deployments::pubsub::listen_pub_sub;
use crate::worker::WorkerEvent;

mod cronjob;
mod deployments;
mod worker;

lazy_static! {
    pub static ref REGION: String = env::var("LAGON_REGION").expect("LAGON_REGION must be set");
}

const SNAPSHOT_BLOB: &[u8] = include_bytes!("../snapshot.bin");
pub const POOL_SIZE: usize = 8;

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
    deployments: Arc<RwLock<HashMap<String, Arc<Deployment>>>>,
    thread_ids: Arc<RwLock<HashMap<String, usize>>>,
    last_requests: Arc<RwLock<HashMap<String, Instant>>>,
    workers: Workers,
) -> Result<HyperResponse<Body>> {
    let url = req.uri().to_string();

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

    let deployments = deployments.read().await;
    let deployment = match deployments.get(&hostname) {
        Some(deployment) => Arc::clone(deployment),
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

    let is_favicon = url == FAVICON_URL;

    if let Some(asset) = find_asset(url, &deployment.assets) {
        let root = Path::new(env::current_dir().unwrap().as_path())
            .join("deployments")
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
        last_requests
            .write()
            .await
            .insert(deployment_id.clone(), Instant::now());

        increment_counter!("lagon_isolate_requests", &labels);

        match Request::from_hyper(req).await {
            Ok(mut request) => {
                counter!("lagon_bytes_in", request.len() as u64, &labels);

                // Try to Extract the X-Real-Ip header or fallback to remote addr IP
                let ip = request
                    .headers
                    .as_ref()
                    .map_or(&ip, |headers| headers.get(X_REAL_IP).unwrap_or(&ip))
                    .to_string();

                request.add_header(X_FORWARDED_FOR.to_string(), ip);
                request.add_header(X_LAGON_REGION.to_string(), REGION.to_string());

                let thread_ids_reader = thread_ids.read().await;

                let thread_id = match thread_ids_reader.get(&hostname) {
                    Some(thread_id) => *thread_id,
                    None => {
                        let mut rng = rand::rngs::StdRng::from_entropy();
                        let id = rng.gen_range(0..POOL_SIZE);

                        drop(thread_ids_reader);

                        thread_ids.write().await.insert(hostname.clone(), id);
                        id
                    }
                };

                let workers = workers.read().await;
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

#[tokio::main]
async fn main() -> Result<()> {
    // Only load a .env file on development
    #[cfg(debug_assertions)]
    dotenv::dotenv().expect("Failed to load .env file");

    let _flush_guard = init_logger(REGION.clone()).expect("Failed to init logger");

    let runtime = Runtime::new(RuntimeOptions::default());
    let addr: SocketAddr = env::var("LAGON_LISTEN_ADDR")
        .expect("LAGON_LISTEN_ADDR must be set")
        .parse()?;
    let prometheus_addr: SocketAddr = env::var("PROMETHEUS_LISTEN_ADDR")
        .expect("PROMETHEUS_LISTEN_ADDR must be set")
        .parse()?;

    let mut builder = PrometheusBuilder::new().with_http_listener(prometheus_addr);

    if let Ok(allowed_subnet) = env::var("PROMETHEUS_ALLOWED_SUBNET") {
        if !allowed_subnet.is_empty() {
            info!("Allowing Prometheus exporter to be accessed from {allowed_subnet}");

            builder = builder.add_allowed_address(allowed_subnet)?;
        }
    }

    builder.install().expect("Failed to start metrics exporter");

    let url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let url = url.as_str();
    let opts = Opts::from_url(url).expect("Failed to parse DATABASE_URL");
    #[cfg(not(debug_assertions))]
    let opts = OptsBuilder::from_opts(opts).ssl_opts(Some(SslOpts::default().with_root_cert_path(
        Some(Cow::from(Path::new("/etc/ssl/certs/ca-certificates.crt"))),
    )));
    let pool = Pool::new(opts)?;
    let conn = pool.get_conn()?;

    let bucket_name = env::var("S3_BUCKET").expect("S3_BUCKET must be set");
    let bucket_region = env::var("S3_REGION").expect("S3_REGION must be set");
    let credentials = Credentials::new(
        Some(&env::var("S3_ACCESS_KEY_ID").expect("S3_ACCESS_KEY_ID must be set")),
        Some(&env::var("S3_SECRET_ACCESS_KEY").expect("S3_SECRET_ACCESS_KEY must be set")),
        None,
        None,
        None,
    )?;

    let bucket = Bucket::new(&bucket_name, bucket_region.parse()?, credentials)?;
    let cronjob = Arc::new(Mutex::new(Cronjob::new().await));

    let deployments = get_deployments(conn, bucket.clone(), Arc::clone(&cronjob)).await?;
    let last_requests = Arc::new(RwLock::new(HashMap::new()));
    let thread_ids = Arc::new(RwLock::new(HashMap::new()));

    let workers = Arc::new(RwLock::new(HashMap::new()));

    for i in 0..POOL_SIZE {
        let worker = flume::unbounded();
        workers.write().await.insert(i, worker);
    }

    start_workers(Arc::clone(&workers)).await;

    let redis = listen_pub_sub(
        bucket.clone(),
        Arc::clone(&deployments),
        Arc::clone(&workers),
        Arc::clone(&cronjob),
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

    let result = tokio::join!(server, redis);

    if let Err(error) = result.0 {
        error!("{}", error);
    }

    if let Err(error) = result.1 {
        error!("{}", error);
    }

    runtime.dispose();

    Ok(())
}
