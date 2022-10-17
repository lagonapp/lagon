use std::{convert::Infallible, net::SocketAddr, sync::Once};

use hyper::{
    body,
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

        let addr = SocketAddr::from(([127, 0, 0, 1], 5555));

        async fn handler(req: HyperRequest<Body>) -> Result<HyperResponse<Body>, Infallible> {
            match req.uri().to_string().as_str() {
                "/request-method" => Ok(HyperResponse::new(req.method().to_string().into())),
                "/request-headers" => {
                    let mut body = req
                        .headers()
                        .iter()
                        .map(|(key, value)| format!("{}: {}", key, value.to_str().unwrap()))
                        .collect::<Vec<String>>();
                    body.sort();

                    let body = body.join(" ");

                    Ok(HyperResponse::new(body.into()))
                }
                "/request-body" => {
                    let body = body::to_bytes(req.into_body()).await.unwrap();

                    return Ok(HyperResponse::new(Body::from(body)));
                }
                "/response-headers" => Ok(HyperResponse::builder()
                    .header("x-token", "hello")
                    .body(Body::empty())
                    .unwrap()),
                "/response-status" => Ok(HyperResponse::builder()
                    .status(302)
                    .body("Moved".into())
                    .unwrap()),
                _ => Ok(HyperResponse::new("Hello, World".into())),
            }
        }

        let make_svc = make_service_fn(|_conn| async { Ok::<_, Infallible>(service_fn(handler)) });

        tokio::task::spawn(async move {
            let server = Server::bind(&addr).serve(make_svc);
            server.await.unwrap();
        });
    });
}

#[tokio::test(flavor = "multi_thread")]
async fn basic_fetch() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5555').then(res => res.text());
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

#[tokio::test(flavor = "multi_thread")]
async fn request_method() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5555/request-method', {
        method: 'POST'
    }).then(res => res.text());

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("POST"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn request_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5555/request-headers', {
        headers: {
            'x-token': 'hello'
        }
    }).then(res => res.text());

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("host: localhost:5555 x-token: hello"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn request_headers_class() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5555/request-headers', {
        headers: new Headers({
            'x-token': 'hello'
        })
    }).then(res => res.text());

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("host: localhost:5555 x-token: hello"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn request_body() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://localhost:5555/request-body', {
        method: 'POST',
        body: 'Hello!'
    }).then(res => res.text());

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello!"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn response_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const response = await fetch('http://localhost:5555/response-headers');
    const body = [];

    for (const [key, value] of response.headers.entries()) {
        // The date is different at each call so we skip it
        if (key === 'date') continue;

        body.push(`${key}: ${value}`);
    }
    
    return new Response(body.sort((a, b) => a.localeCompare(b)).join(' '));
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("content-length: 0 x-token: hello"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn response_status() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const response = await fetch('http://localhost:5555/response-status');
    const body = await response.text();

    return new Response(`${body}: ${response.status}`);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Moved: 302"))
    );
}
