use http::hyper_request_to_request;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::RunResult;
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use metrics::{histogram, increment_counter, counter};
use metrics_exporter_prometheus::PrometheusBuilder;
use mysql::Pool;
use s3::creds::Credentials;
use s3::Bucket;
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use tokio::task::LocalSet;

use crate::deployments::assets::handle_asset;
use crate::deployments::filesystem::get_deployment_code;
use crate::deployments::get_deployments;
use crate::deployments::pubsub::listen_pub_sub;
use crate::http::response_to_hyper_response;

mod deployments;
mod http;

async fn handle_request(
    req: HyperRequest<Body>,
    request_tx: flume::Sender<HyperRequest<Body>>,
    response_rx: flume::Receiver<RunResult>,
) -> Result<HyperResponse<Body>, Infallible> {
    request_tx.send_async(req).await;

    let result = response_rx
        .recv_async()
        .await
        .unwrap_or(RunResult::Error("Failed to receive".into()));

    match result {
        RunResult::Response(response) => {
            let response = response_to_hyper_response(response);

            Ok(response)
        }
        RunResult::Error(error) => Ok(HyperResponse::builder()
            .status(500)
            .body(error.into())
            .unwrap()),
        RunResult::Timeout() => Ok(HyperResponse::new("Timeouted".into())),
        RunResult::MemoryLimit() => Ok(HyperResponse::new("MemoryLimited".into())),
        RunResult::NotFound() => Ok(HyperResponse::builder()
            .status(404)
            .body("Deployment not found".into())
            .unwrap()),
    }
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    let runtime = Runtime::new(RuntimeOptions::default());
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));

    let (request_tx, request_rx) = flume::unbounded::<HyperRequest<Body>>();
    let (response_tx, response_rx) = flume::unbounded::<RunResult>();

    let server = Server::bind(&addr).serve(make_service_fn(move |_conn| {
        let request_tx = request_tx.clone();
        let response_rx = response_rx.clone();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(req, request_tx.clone(), response_rx.clone())
            }))
        }
    }));

    let builder = PrometheusBuilder::new();
    builder.install().expect("Failed to start metrics exporter");

    let url = dotenv::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let url = url.as_str();
    let pool = Pool::new(url).unwrap();
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

    let local_set = LocalSet::new();

    let request_handler = local_set.run_until(async move {
        tokio::task::spawn_local(async move {
            let deployments = deployments.clone();
            let mut isolates = HashMap::new();

            loop {
                let hyper_request = request_rx.recv_async().await.unwrap();
                let request = hyper_request_to_request(hyper_request).await;

                let hostname = request.headers.get("host").unwrap().clone();
                let deployments = deployments.read().await;

                match deployments.get(&hostname) {
                    Some(deployment) => {
                        let url = &mut request.url.clone();
                        url.remove(0);

                        let labels = vec![
                            ("deployment", deployment.id.clone()),
                            ("function", deployment.function_id.clone()),
                        ];

                        increment_counter!("lagon_requests", &labels);
                        counter!("lagon_bytes_in", request.len() as u64, &labels);

                        if let Some(asset) = deployment.assets.iter().find(|asset| *asset == url) {
                            // TODO: handle read error
                            let response = handle_asset(deployment, asset).unwrap();
                            let response = RunResult::Response(response);

                            response_tx.send_async(response).await.unwrap();
                        } else {
                            let isolate = isolates.entry(hostname).or_insert_with(|| {
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

                            let (run_result, maybe_statistics) = isolate.run(request);

                            if let Some(statistics) = maybe_statistics {
                                histogram!("lagon_isolate_cpu_time", statistics.cpu_time, &labels);
                                histogram!(
                                    "lagon_isolate_memory_usage",
                                    statistics.memory_usage as f64,
                                    &labels
                                );
                            }

                            if let RunResult::Response(response) = &run_result {
                                counter!("lagon_bytes_out", response.len() as u64, &labels);
                            }

                            response_tx.send_async(run_result).await.unwrap();
                        }
                    }
                    None => {
                        response_tx.send_async(RunResult::NotFound()).await.unwrap();
                    }
                };
            }
        })
        .await
    });

    tokio::join!(server, redis, request_handler);

    // if let Err(e) =  {
    //     eprintln!("server error: {}", e);
    // }

    runtime.dispose();
}
