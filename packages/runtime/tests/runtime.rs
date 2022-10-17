use std::{collections::HashMap, sync::Once};

use hyper::body::Bytes;
use lagon_runtime::{
    http::{Method, Request, Response, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test]
async fn execute_function() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
}

#[tokio::test]
async fn environment_variables() {
    setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    return new Response(process.env.TEST);
}"
            .into(),
        )
        .with_environment_variables(
            vec![("TEST".into(), "Hello world".into())]
                .into_iter()
                .collect(),
        ),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
}

#[tokio::test]
async fn get_body() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate
        .run(
            Request {
                body: Bytes::from("Hello world"),
                headers: None,
                method: Method::GET,
                url: "".into(),
            },
            tx,
        )
        .await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
}

#[tokio::test]
async fn get_input() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.url);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate
        .run(
            Request {
                body: Bytes::new(),
                headers: None,
                method: Method::GET,
                url: "https://hello.world".into(),
            },
            tx,
        )
        .await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("https://hello.world"))
    );
}

#[tokio::test]
async fn get_method() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.method);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate
        .run(
            Request {
                body: Bytes::new(),
                headers: None,
                method: Method::POST,
                url: "".into(),
            },
            tx,
        )
        .await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("POST"))
    );
}

#[tokio::test]
async fn get_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.headers.get('x-auth'));
}"
        .into(),
    ));

    let mut headers = HashMap::new();
    headers.insert("x-auth".into(), "token".into());

    let (tx, rx) = flume::unbounded();
    isolate
        .run(
            Request {
                body: Bytes::new(),
                headers: Some(headers),
                method: Method::POST,
                url: "".into(),
            },
            tx,
        )
        .await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("token"))
    );
}

#[tokio::test]
async fn return_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world', {
        headers: {
            'Content-Type': 'text/html',
            'X-Test': 'test',
        }
    });
}"
        .into(),
    ));

    let mut headers = HashMap::new();
    headers.insert("Content-Type".into(), "text/html".into());
    headers.insert("X-Test".into(), "test".into());

    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: Some(headers),
            status: 200,
        })
    );
}

#[tokio::test]
async fn return_headers_from_headers_api() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world', {
        headers: new Headers({
            'Content-Type': 'text/html',
            'X-Test': 'test',
        })
    });
}"
        .into(),
    ));

    let mut headers = HashMap::new();
    headers.insert("Content-Type".into(), "text/html".into());
    headers.insert("X-Test".into(), "test".into());

    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: Some(headers),
            status: 200,
        })
    );
}

#[tokio::test]
async fn return_status() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Moved permanently', {
        status: 302,
    });
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response {
            body: "Moved permanently".into(),
            headers: None,
            status: 302,
        })
    );
}

#[tokio::test]
async fn return_uint8array() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    // TextEncoder#encode returns a Uint8Array
    const body = new TextEncoder().encode('Hello world');
    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn console_log() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const types = ['log', 'info', 'debug', 'error', 'warn'];

    types.forEach(type => {
        console[type]('Hello world!')
    })

    return new Response('');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::default())
    );
}
