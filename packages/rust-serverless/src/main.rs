use http::hyper_request_to_request;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::RunResult;
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Instant;

use crate::http::response_to_hyper_response;

mod http;

async fn handle_request(
    req: HyperRequest<Body>,
    request_tx: flume::Sender<HyperRequest<Body>>,
    response_rx: flume::Receiver<RunResult>,
) -> Result<HyperResponse<Body>, Infallible> {
    let now = Instant::now();

    request_tx.send_async(req).await.unwrap();

    let result = response_rx
        .recv_async()
        .await
        .unwrap_or(RunResult::Error("Failed to receive".into()));

    match result {
        RunResult::Response(response, duration) => {
            // println!(
            //     "Response: {:?} in {:?} (CPU time) (Total: {:?})",
            //     response,
            //     duration,
            //     now.elapsed()
            // );

            let response = response_to_hyper_response(response);

            Ok(response)
        }
        RunResult::Error(error) => {
            println!("Error: {}", error);
            Ok(HyperResponse::builder()
                .status(500)
                .body(error.into())
                .unwrap())
        }
        RunResult::Timeout() => {
            // println!("Timeout");
            Ok(HyperResponse::new("Timeouted".into()))
        }
        RunResult::MemoryLimit() => {
            // println!("MemoryLimit");
            Ok(HyperResponse::new("MemoryLimited".into()))
        }
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let runtime = Runtime::new(RuntimeOptions::default());
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

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

    let wait = tokio::spawn(async move {
        let mut isolates = HashMap::new();

        loop {
            let request = request_rx.recv_async().await.unwrap();
            let request = hyper_request_to_request(request).await;

            let hostname = request.headers.get("host").unwrap().clone();

            let isolate = isolates.entry(hostname).or_insert_with(|| {
                Isolate::new(IsolateOptions::default(
                    "
export async function handler(request) {
    console.log(await fetch('urldetest'))
    return new Response('hello world!')
}"
                    .into(),
                ))
            });

            // println!("Request: {:?}", request);
            let result = isolate.run(request);

            response_tx.send_async(result).await.unwrap();
        }
    });

    tokio::join!(server, wait);

    // if let Err(e) =  {
    //     eprintln!("server error: {}", e);
    // }

    runtime.dispose();
}
