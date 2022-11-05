use anyhow::Result;
use deployments::Deployment;
use hyper::body::Bytes;
use hyper::header::HOST;
use hyper::http::response::Builder;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::{Request, RunResult, StreamResult};
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use lazy_static::lazy_static;
use log::{error, info};
use lru_time_cache::LruCache;
use metrics::increment_counter;
use metrics_exporter_prometheus::PrometheusBuilder;
use mysql::{Opts, Pool};
#[cfg(not(debug_assertions))]
use mysql::{OptsBuilder, SslOpts};
use rand::prelude::*;
use s3::creds::Credentials;
use s3::Bucket;
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio_util::task::LocalPoolHandle;

use crate::deployments::assets::handle_asset;
use crate::deployments::filesystem::get_deployment_code;
use crate::deployments::get_deployments;
use crate::deployments::pubsub::listen_pub_sub;
use crate::logger::init_logger;

mod deployments;
mod logger;

lazy_static! {
    pub static ref ISOLATES: RwLock<HashMap<usize, LruCache<String, Isolate>>> =
        RwLock::new(HashMap::new());
    static ref X_FORWARDED_FOR: String = String::from("X-Forwarded-For");
    static ref ISOLATES_CACHE_SECONDS: Duration = Duration::from_secs(
        dotenv::var("LAGON_ISOLATES_CACHE_SECONDS")
            .expect("LAGON_ISOLATES_CACHE_SECONDS must be set")
            .parse()
            .expect("Failed to parse LAGON_ISOLATES_CACHE_SECONDS")
    );
}

const POOL_SIZE: usize = 8;
const PAGE_404: &str = include_str!("../public/404.html");
const PAGE_502: &str = include_str!("../public/502.html");
const PAGE_500: &str = include_str!("../public/500.html");

async fn handle_request(
    req: HyperRequest<Body>,
    ip: String,
    pool: LocalPoolHandle,
    deployments: Arc<RwLock<HashMap<String, Deployment>>>,
    thread_ids: Arc<RwLock<HashMap<String, usize>>>,
) -> Result<HyperResponse<Body>> {
    let mut url = req.uri().to_string();
    // Remove the leading '/' from the url
    url.remove(0);

    let hostname = match req.headers().get(HOST) {
        Some(hostname) => hostname.to_str()?.to_string(),
        None => return Ok(Builder::new().status(404).body(PAGE_404.into())?),
    };

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

    let (tx, rx) = flume::unbounded();

    pool.spawn_pinned_by_idx(
        move || {
            async move {
                let deployments = deployments.read().await;

                match deployments.get(&hostname) {
                    Some(deployment) => {
                        let labels = vec![
                            ("deployment", deployment.id.clone()),
                            ("function", deployment.function_id.clone()),
                        ];

                        increment_counter!("lagon_requests", &labels);
                        // TODO: find the right request bytes length
                        // counter!("lagon_bytes_in", request.len() as u64, &labels);

                        if let Some(asset) = deployment.assets.iter().find(|asset| *asset == &url) {
                            let run_result = match handle_asset(deployment, asset) {
                                Ok(response) => RunResult::Response(response),
                                Err(error) => {
                                    error!(
                                        "Error while handing asset ({}, {}): {}",
                                        asset, deployment.id, error
                                    );

                                    RunResult::Error("Could not retrieve asset.".into())
                                }
                            };

                            tx.send_async(run_result).await.unwrap_or(());
                        } else {
                            let maybe_request = Request::from_hyper(req).await;

                            if let Err(error) = maybe_request {
                                error!(
                                    "Error while parsing request ({}): {}",
                                    deployment.id, error
                                );

                                tx.send_async(RunResult::Error(
                                    "Error while parsing request".into(),
                                ))
                                .await
                                .unwrap_or(());

                                return;
                            }

                            // Now it's safe to unwrap() since we checked for errors above
                            let mut request = maybe_request.unwrap();
                            request.add_header(X_FORWARDED_FOR.to_string(), ip);

                            // Only acquire the lock when we are sure we have a
                            // deployment and that the isolate should be called.
                            // TODO: read() then write() if not present
                            let mut isolates = ISOLATES.write().await;
                            let thread_isolates = isolates.entry(thread_id).or_insert_with(|| {
                                LruCache::with_expiry_duration(*ISOLATES_CACHE_SECONDS)
                            });

                            let isolate = thread_isolates.entry(hostname).or_insert_with(|| {
                                info!("Creating new isolate: {} ", deployment.id);
                                // TODO: handle read error
                                let code = get_deployment_code(deployment).unwrap();
                                let options = IsolateOptions::new(code)
                                    .with_environment_variables(
                                        deployment.environment_variables.clone(),
                                    )
                                    .with_memory(deployment.memory)
                                    .with_timeout(deployment.timeout)
                                    .with_id(deployment.id.clone())
                                    .with_on_drop_callback(Box::new(|id| {
                                        info!("Dropping isolate: {}", id.unwrap());
                                    }));

                                Isolate::new(options)
                            });

                            isolate.run(request, tx.clone()).await;

                            // TODO: handle stats
                            // if let Some(statistics) = maybe_statistics {
                            //     histogram!("lagon_isolate_cpu_time", statistics.cpu_time, &labels);
                            //     histogram!(
                            //         "lagon_isolate_memory_usage",
                            //         statistics.memory_usage as f64,
                            //         &labels
                            //     );
                            // }
                            //
                            // if let RunResult::Response(response) = &run_result {
                            //     counter!("lagon_bytes_out", response.len() as u64, &labels);
                            // }
                            //
                            // if run_result != RunResult::Stream {
                            //     tx.send_async(run_result).await.unwrap();
                            // }
                        }
                    }
                    None => {
                        tx.send_async(RunResult::NotFound).await.unwrap_or(());
                    }
                }
            }
        },
        thread_id,
    );

    let result = rx.recv_async().await?;

    match result {
        RunResult::Stream(stream_result) => {
            let (stream_tx, stream_rx) = flume::unbounded::<Result<Bytes, std::io::Error>>();
            let body = Body::wrap_stream(stream_rx.into_stream());

            let (response_tx, response_rx) = flume::bounded(1);

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap_or(());
                }
                StreamResult::Data(bytes) => {
                    let bytes = Bytes::from(bytes);
                    stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                }
                StreamResult::Done => panic!("Got a stream done without data"),
            }

            tokio::spawn(async move {
                while let Ok(RunResult::Stream(stream_result)) = rx.recv_async().await {
                    match stream_result {
                        StreamResult::Start(response) => {
                            response_tx.send_async(response).await.unwrap_or(());
                        }
                        StreamResult::Data(bytes) => {
                            let bytes = Bytes::from(bytes);
                            stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                        }
                        _ => {}
                    }
                }
            });

            let response = response_rx.recv_async().await?;
            let hyper_response = Builder::try_from(&response)?.body(body)?;

            Ok(hyper_response)
        }
        RunResult::Response(response) => {
            let hyper_response = Builder::try_from(&response)?.body(response.body.into())?;

            Ok(hyper_response)
        }
        RunResult::Timeout | RunResult::MemoryLimit => {
            Ok(HyperResponse::builder().status(502).body(PAGE_502.into())?)
        }
        RunResult::Error(_) => Ok(HyperResponse::builder().status(500).body(PAGE_500.into())?),
        RunResult::NotFound => Ok(HyperResponse::builder().status(404).body(PAGE_404.into())?),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().expect("Failed to load .env file");
    let _flush_guard = init_logger().expect("Failed to init logger");

    let runtime = Runtime::new(RuntimeOptions::default());
    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));

    let builder = PrometheusBuilder::new();
    builder.install().expect("Failed to start metrics exporter");

    let url = dotenv::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let url = url.as_str();
    let opts = Opts::from_url(url).expect("Failed to parse DATABASE_URL");
    #[cfg(not(debug_assertions))]
    let opts = OptsBuilder::from_opts(opts).ssl_opts(Some(
        SslOpts::default().with_danger_accept_invalid_certs(true),
    ));
    let pool = Pool::new(opts)?;
    let conn = pool.get_conn()?;

    let bucket_name = dotenv::var("S3_BUCKET").expect("S3_BUCKET must be set");
    let region = "eu-west-3".parse()?;
    let credentials = Credentials::new(
        Some(&dotenv::var("S3_ACCESS_KEY_ID").expect("S3_ACCESS_KEY_ID must be set")),
        Some(&dotenv::var("S3_SECRET_ACCESS_KEY").expect("S3_SECRET_ACCESS_KEY must be set")),
        None,
        None,
        None,
    )?;

    let bucket = Bucket::new(&bucket_name, region, credentials)?;

    let deployments = get_deployments(conn, bucket.clone()).await?;
    let redis = listen_pub_sub(bucket.clone(), deployments.clone());

    let pool = LocalPoolHandle::new(POOL_SIZE);
    let thread_ids = Arc::new(RwLock::new(HashMap::new()));

    let server = Server::bind(&addr).serve(make_service_fn(move |conn: &AddrStream| {
        let deployments = deployments.clone();
        let pool = pool.clone();
        let thread_ids = thread_ids.clone();

        let addr = conn.remote_addr();
        let ip = addr.ip().to_string();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(
                    req,
                    ip.clone(),
                    pool.clone(),
                    deployments.clone(),
                    thread_ids.clone(),
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
