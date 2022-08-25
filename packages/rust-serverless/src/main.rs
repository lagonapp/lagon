use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};
use lagon_runtime::result::RunResult;
use lagon_runtime::runtime::{Isolate, Runtime};
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Instant;

async fn handle_request(
    _req: Request<Body>,
    request_tx: flume::Sender<()>,
    response_rx: flume::Receiver<RunResult>,
) -> Result<Response<Body>, Infallible> {
    let now = Instant::now();

    request_tx.send_async(()).await;

    let result = response_rx
        .recv_async()
        .await
        .unwrap_or(RunResult::Error("Failed to receive".into()));

    match result {
        RunResult::Response(response, duration) => {
            // println!(
            //     "Response: {} in {:?} (CPU time) (Total: {:?})",
            //     response,
            //     duration,
            //     now.elapsed()
            // );
            Ok(Response::new(response.into()))
        }
        RunResult::Error(error) => {
            println!("Error: {}", error);
            Ok(Response::builder().status(500).body(error.into()).unwrap())
        }
        RunResult::Timeout() => {
            // println!("Timeout");
            Ok(Response::new("Timeouted".into()))
        }
        RunResult::MemoryLimit() => {
            // println!("MemoryLimit");
            Ok(Response::new("MemoryLimited".into()))
        }
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let runtime = Runtime::new(None);
    // let tokio_runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    let (request_tx, request_rx) = flume::unbounded::<()>();
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
        isolates.insert("hostname", Isolate::new());

        loop {
            request_rx.recv_async().await;

            let isolate = isolates.get_mut("hostname").unwrap();
            let result = isolate.run();

            response_tx.send_async(result).await;
        }
    });

    tokio::join!(server, wait);

    // if let Err(e) =  {
    //     eprintln!("server error: {}", e);
    // }

    runtime.dispose();
}
