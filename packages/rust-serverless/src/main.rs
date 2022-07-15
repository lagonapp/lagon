use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};
use lagon_runtime::result::RunResult;
use lagon_runtime::runtime::Runtime;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Instant;

async fn hello_world(
    _req: Request<Body>,
    runtime: Arc<Runtime>,
) -> Result<Response<Body>, Infallible> {
    let now = Instant::now();
    let result = runtime
        .run(
            "export function handler() {
                log('test')
                return 'Hello World';
            }",
            None,
        )
        .await;

    match result {
        RunResult::Response(response, duration) => {
            println!(
                "Response: {} in {:?} (total: {:?})",
                response,
                duration,
                now.elapsed()
            );
            Ok(Response::new(response.into()))
        }
        RunResult::Error(error) => {
            println!("Error: {}", error);
            Ok(Response::new(error.into()))
        }
        RunResult::Timeout() => {
            println!("Timeout");
            Ok(Response::new("Timeouted".into()))
        }
        RunResult::MemoryLimit() => {
            println!("MemoryLimit");
            Ok(Response::new("MemoryLimited".into()))
        }
    }
}

#[tokio::main]
async fn main() {
    let runtime = Arc::new(Runtime::new(None));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    let server = Server::bind(&addr).serve(make_service_fn(move |_conn| {
        let runtime = runtime.clone();
        async move { Ok::<_, Infallible>(service_fn(move |req| hello_world(req, runtime.clone()))) }
    }));

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }

    // runtime.dispose();
}
