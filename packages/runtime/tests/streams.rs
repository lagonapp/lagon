use std::{collections::HashMap, sync::Once};

use httptest::{matchers::*, responders::*, Expectation, Server};
use hyper::body::Bytes;
use lagon_runtime::{
    http::{Request, Response, RunResult, StreamResult},
    isolate::{options::IsolateOptions, Isolate},
    runtime::{options::RuntimeOptions, Runtime},
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
async fn queue_multiple() {
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
async fn custom_response() {
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
async fn start_and_pull() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response(
        new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('Loading...'));
            },
            pull(controller) {
                controller.enqueue(new TextEncoder().encode('Hello'));
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

#[tokio::test(flavor = "multi_thread")]
async fn response_before_write() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export function handler() {{
    const transformStream = new TransformStream({{
        start(controller) {{
            controller.enqueue(new TextEncoder().encode('Loading...'));
        }}
    }})

    const writeableStream = transformStream.writable;
    const readableStream = transformStream.readable;

    const writer = writeableStream.getWriter();

    fetch('{url}').then(res => res.text().then(text => {{
        writer.write(new TextEncoder().encode(text));
        writer.close();
    }}))

    return new Response(readableStream);
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
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111]))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Done)
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn timeout_infinite_streaming() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const { readable } = new TransformStream()

    return new Response(readable);
}"
        .to_owned(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert_eq!(rx.recv_async().await.unwrap(), RunResult::Timeout);
}

#[tokio::test(flavor = "multi_thread")]
async fn promise_reject_callback() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const { readable } = new TransformStream()

    async function trigger() {
        doesNotExists();
    }

    trigger();

    return new Response(readable);
}"
        .to_owned(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("ReferenceError: doesNotExists is not defined".to_owned())
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn promise_reject_callback_after_response() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const output = new TextEncoder().encode('This is rendered as binary stream with non-ASCII chars 😊');

    const { readable, writable } = new TransformStream();

    async function stream() {
        // Just to delay a bit
        await fetch('https://google.com');

        const writer = writable.getWriter();
        for (let i = 0; i < output.length; i++) {
            await new Promise(resolve => {
                doesNotExists(resolve, 0);
            });
            writer.write(new Uint8Array([output[i]]));
        }
    }

    stream();

    return new Response(readable);
}"
        .to_owned(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("ReferenceError: doesNotExists is not defined".to_owned())
    );
    assert!(rx.recv_async().await.is_err());
}
