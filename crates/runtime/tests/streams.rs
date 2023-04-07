use httptest::{bytes::Bytes, matchers::*, responders::*, Expectation, Server};
use lagon_runtime_http::{Request, Response, RunResult, StreamResult};
use lagon_runtime_isolate::options::IsolateOptions;
use std::collections::HashMap;

mod utils;

#[tokio::test]
async fn sync_streaming() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67]))
    );

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
}

#[tokio::test]
async fn queue_multiple() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    for _ in 0..3 {
        assert_eq!(
            receiver.recv_async().await.unwrap(),
            RunResult::Stream(StreamResult::Data(vec![65]))
        );
    }

    assert!(receiver.recv_async().await.unwrap().as_stream_done());
    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
}

#[tokio::test]
async fn custom_response() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());
    let mut headers = HashMap::new();
    headers.insert("x-lagon".into(), vec!["test".into()]);

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67]))
    );

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response {
            body: Bytes::from("[object ReadableStream]"),
            status: 201,
            headers: Some(headers),
        }))
    );
}

#[tokio::test]
async fn start_and_pull() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![
            76, 111, 97, 100, 105, 110, 103, 46, 46, 46
        ]))
    );

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111]))
    );

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );
}

#[tokio::test]
async fn response_before_write() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![
            76, 111, 97, 100, 105, 110, 103, 46, 46, 46
        ]))
    );

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111]))
    );

    assert!(receiver.recv_async().await.unwrap().as_stream_done());
}

#[tokio::test]
async fn timeout_infinite_streaming() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const { readable } = new TransformStream()

    return new Response(readable);
}"
        .to_owned(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );

    assert_eq!(receiver.recv_async().await.unwrap(), RunResult::Timeout);
}

#[tokio::test]
async fn promise_reject_callback() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(receiver.recv_async().await.unwrap(), RunResult::Error("Uncaught ReferenceError: doesNotExists is not defined\n  at trigger (5:9)\n  at handler (8:5)".to_owned()));
}

#[tokio::test]
async fn promise_reject_callback_after_response() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const output = new TextEncoder().encode('This is rendered as binary stream with non-ASCII chars 😊');

    const { readable, writable } = new TransformStream();

    async function stream() {
        await new Promise(resolve => setTimeout(resolve, 100))

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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response::from(
            "[object ReadableStream]"
        )))
    );

    assert_eq!(receiver.recv_async().await.unwrap(), RunResult::Error("Uncaught ReferenceError: doesNotExists is not defined\n  at 12:17\n  at stream (11:19)".to_owned()));
}
