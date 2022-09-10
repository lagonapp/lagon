use http::hyper_request_to_request;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::RunResult;
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use mysql::prelude::Queryable;
use mysql::Pool;
use s3::creds::Credentials;
use s3::Bucket;
use std::collections::HashMap;
use std::convert::Infallible;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;

use crate::deployments::assets::handle_asset;
use crate::deployments::{get_deployment_code, get_deployments, Deployment};
use crate::http::response_to_hyper_response;

mod deployments;
mod http;

async fn handle_request(
    req: HyperRequest<Body>,
    request_tx: flume::Sender<HyperRequest<Body>>,
    response_rx: flume::Receiver<RunResult>,
) -> Result<HyperResponse<Body>, Infallible> {
    let now = Instant::now();

    request_tx.send_async(req).await;

    let result = response_rx
        .recv_async()
        .await
        .unwrap_or(RunResult::Error("Failed to receive".into()));

    match result {
        RunResult::Response(response) => {
            // println!(
            //     "Response: {:?} in {:?} (CPU time) (Total: {:?})",
            //     response,
            //     duration,
            //     now.elapsed()
            // );

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

#[tokio::main(flavor = "current_thread")]
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

    let deployments = get_deployments(conn, bucket).await;

    let request_handler = tokio::spawn(async move {
        let deployments = deployments.clone();
        let deployments = deployments.read().await;
        let mut isolates = HashMap::new();

        loop {
            let request = request_rx.recv_async().await.unwrap();
            let request = hyper_request_to_request(request).await;

            let hostname = request.headers.get("host").unwrap().clone();

            match deployments.get(&hostname) {
                Some(deployment) => {
                    let url = &mut request.url.clone();
                    url.remove(0);

                    if let Some(asset) = deployment.assets.iter().find(|asset| *asset == url) {
                        // TODO: handle read error
                        let response = handle_asset(deployment, asset).unwrap();
                        let response = RunResult::Response(response);

                        response_tx.send_async(response).await.unwrap();
                    } else {
                        let isolate = isolates.entry(hostname).or_insert_with(|| {
                            // TODO: handle read error
                            let code = get_deployment_code(deployment).unwrap();

                            Isolate::new(IsolateOptions::default(code))
                        });

                        let result = isolate.run(request);

                        response_tx.send_async(result).await.unwrap();
                    }
                }
                None => {
                    response_tx.send_async(RunResult::NotFound()).await.unwrap();
                }
            };
        }
    });

    tokio::join!(server, request_handler);

    // if let Err(e) =  {
    //     eprintln!("server error: {}", e);
    // }

    runtime.dispose();
}
