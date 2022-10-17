use deployments::Deployment;
use hyper::body::Bytes;
use hyper::http::response::Builder;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::{Request, RunResult, StreamResult};
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use lazy_static::lazy_static;
use log::error;
use metrics::{counter, /*histogram,*/ increment_counter};
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
    static ref ISOLATES: RwLock<HashMap<usize, HashMap<String, Isolate>>> =
        RwLock::new(HashMap::new());
}

const POOL_SIZE: usize = 8;

async fn handle_request(
    req: HyperRequest<Body>,
    pool: LocalPoolHandle,
    deployments: Arc<RwLock<HashMap<String, Deployment>>>,
    thread_ids: Arc<RwLock<HashMap<String, usize>>>,
) -> Result<HyperResponse<Body>, Infallible> {
    let mut url = req.uri().to_string();
    // Remove the leading '/' from the url
    url.remove(0);

    let request = Request::from_hyper(req).await;
    let hostname = request
        .headers
        .as_ref()
        .unwrap()
        .get("host")
        .unwrap()
        .clone();

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

    let (tx, rx) = flume::bounded(1);

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
                        counter!("lagon_bytes_in", request.len() as u64, &labels);

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

                            tx.send_async(run_result).await.unwrap();
                        } else {
                            // Only acquire the lock when we are sure we have a
                            // deployment and that the isolate should be called.
                            // TODO: read() then write() if not present
                            let mut isolates = ISOLATES.write().await;
                            let thread_isolates =
                                isolates.entry(thread_id).or_insert_with(HashMap::new);

                            let isolate = thread_isolates.entry(hostname).or_insert_with(|| {
                                // TODO: handle read error
                                let code = get_deployment_code(deployment).unwrap();
                                let options = IsolateOptions::new(code)
                                    .with_environment_variables(
                                        deployment.environment_variables.clone(),
                                    )
                                    .with_memory(deployment.memory)
                                    .with_timeout(deployment.timeout);

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
                        tx.send_async(RunResult::NotFound).await.unwrap();
                    }
                }
            }
        },
        thread_id,
    );

    let result = rx.recv_async().await.unwrap();

    match result {
        RunResult::Stream(stream_result) => {
            let (mut sender, body) = Body::channel();

            let (response_tx, response_rx) = flume::bounded(1);
            let mut received_response = false;

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap();
                    received_response = true;
                }
                StreamResult::Data(bytes) => {
                    let bytes = Bytes::from(bytes);
                    sender.send_data(bytes).await.unwrap();
                }
                StreamResult::Done => panic!("Got a stream done without data"),
            }

            tokio::spawn(async move {
                while let Ok(RunResult::Stream(stream_result)) = rx.recv_async().await {
                    match stream_result {
                        StreamResult::Start(response) => {
                            response_tx.send_async(response).await.unwrap();
                            received_response = true;
                        }
                        StreamResult::Data(bytes) => {
                            let bytes = Bytes::from(bytes);
                            sender.send_data(bytes).await.unwrap();
                        }
                        StreamResult::Done => {
                            // Dropping the sender will end the body streaming,
                            // and we only want to drop it when the Response
                            // has been constructed
                            if received_response {
                                drop(sender);
                                break;
                            }
                        }
                    }
                }
            });

            let response = response_rx.recv_async().await.unwrap();

            let hyper_response = Builder::from(&response);
            let hyper_response = hyper_response.body(body).unwrap();

            Ok(hyper_response)
        }
        RunResult::Response(response) => {
            let hyper_response = Builder::from(&response);
            let hyper_response = hyper_response.body(response.body.into()).unwrap();

            Ok(hyper_response)
        }
        RunResult::Error(error) => Ok(HyperResponse::builder()
            .status(500)
            .body(error.into())
            .unwrap()),
        RunResult::Timeout => Ok(HyperResponse::new("Timeouted".into())),
        RunResult::MemoryLimit => Ok(HyperResponse::new("MemoryLimited".into())),
        RunResult::NotFound => Ok(HyperResponse::builder()
            .status(404)
            .body("Deployment not found".into())
            .unwrap()),
    }
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().expect("Failed to load .env file");
    init_logger().expect("Failed to init logger");

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
    let pool = Pool::new(opts).unwrap();
    let conn = pool.get_conn().unwrap();

    let bucket_name = dotenv::var("S3_BUCKET").expect("S3_BUCKET must be set");
    let region = "eu-west-3".parse().unwrap();
    let credentials = Credentials::new(
        Some(&dotenv::var("S3_ACCESS_KEY_ID").expect("S3_ACCESS_KEY_ID must be set")),
        Some(&dotenv::var("S3_SECRET_ACCESS_KEY").expect("S3_SECRET_ACCESS_KEY must be set")),
        None,
        None,
        None,
    )
    .unwrap();

    let bucket = Bucket::new(&bucket_name, region, credentials).unwrap();

    let deployments = get_deployments(conn, bucket.clone()).await;
    let redis = listen_pub_sub(bucket.clone(), deployments.clone());

    let pool = LocalPoolHandle::new(POOL_SIZE);
    let thread_ids = Arc::new(RwLock::new(HashMap::new()));

    let server = Server::bind(&addr).serve(make_service_fn(move |_conn| {
        let deployments = deployments.clone();
        let pool = pool.clone();
        let thread_ids = thread_ids.clone();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(req, pool.clone(), deployments.clone(), thread_ids.clone())
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
}
