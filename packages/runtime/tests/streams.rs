use std::{collections::HashMap, sync::Once};

// use httptest::{matchers::*, responders::*, Expectation, Server};
use hyper::body::Bytes;
use lagon_runtime::{
    http::{Request, Response, RunResult, StreamResult},
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
async fn sync_streaming() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response(
        new ReadableStream({
            pull(controller) {
                controller.enqueue(new Uint8Array([65, 66, 67]));
                controller.close();
            },
        }),
    );
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67]))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Done)
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn sync_streaming_multiple() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    let count = 0;
    return new Response(
        new ReadableStream({
            pull(controller) {
                count++;

                controller.enqueue(new Uint8Array([65]));

                if (count == 3) {
                    controller.close();
                }
            },
        }),
    );
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    for _ in 0..3 {
        assert_eq!(
            rx.recv_async().await.unwrap(),
            RunResult::Stream(StreamResult::Data(vec![65]))
        );
    }

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Done)
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn streaming_with_correct_response() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response(
        new ReadableStream({
            pull(controller) {
                controller.enqueue(new Uint8Array([65, 66, 67]));
                controller.close();
            },
        }),
        {
            status: 201,
            headers: {
                'x-lagon': 'test',
            },
        },
    );
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67]))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Done)
    );
    let mut headers = HashMap::new();
    headers.insert("x-lagon".into(), "test".into());
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response {
            body: Bytes::from("[object ReadableStream]"),
            status: 201,
            headers: Some(headers),
        }))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn sync_streaming_start_pull() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export function handler() {{
    return new Response(
        new ReadableStream({{
            start(controller) {{
                controller.enqueue(new TextEncoder().encode('Loading...'));
            }},
            pull(controller) {{
                controller.enqueue(new TextEncoder().encode('Hello'));
                controller.close();
            }},
        }}),
    );
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![
            76, 111, 97, 100, 105, 110, 103, 46, 46, 46
        ]))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111]))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Done)
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert!(rx.recv_async().await.is_err());
}
