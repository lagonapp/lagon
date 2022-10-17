use std::{convert::Infallible, net::SocketAddr, sync::Once};

use hyper::{
    service::{make_service_fn, service_fn},
    Body, Request as HyperRequest, Response as HyperResponse, Server,
};
use lagon_runtime::{
    http::{Request, Response, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test(flavor = "multi_thread")]
async fn execute_async_handler() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    return new Response('Async handler');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Async handler"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn execute_promise() {
    let addr = SocketAddr::from(([127, 0, 0, 1], 5556));

    async fn handler(req: HyperRequest<Body>) -> Result<HyperResponse<Body>, Infallible> {
        match req.uri().to_string().as_str() {
            _ => Ok(HyperResponse::new("Hello, World".into())),
        }
    }

    let make_svc = make_service_fn(|_conn| async { Ok::<_, Infallible>(service_fn(handler)) });

    tokio::task::spawn(async move {
        let server = Server::bind(&addr).serve(make_svc);
        server.await.unwrap();
    });

    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5556').then((res) => res.text());
    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello, World"))
    );
}
