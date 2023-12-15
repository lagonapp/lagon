use hyper::{Request, Response};
use lagon_runtime_http::{RunResult, StreamResult};
use lagon_runtime_isolate::options::IsolateOptions;

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

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67])),
    )
    .await;

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;
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
        utils::assert_run_result(&receiver, RunResult::Stream(StreamResult::Data(vec![65]))).await;
    }

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;
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

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![65, 66, 67])),
    )
    .await;

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(
            Response::builder().status(201).header("x-lagon", "test"),
        )),
    )
    .await;
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

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![
            76, 111, 97, 100, 105, 110, 103, 46, 46, 46,
        ])),
    )
    .await;

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111])),
    )
    .await;

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;
}

#[tokio::test]
async fn response_before_write() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const transformStream = new TransformStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('Loading...'));
        }
    })

    const writeableStream = transformStream.writable;
    const readableStream = transformStream.readable;

    const writer = writeableStream.getWriter();

    setTimeout(() => {
        writer.write(new TextEncoder().encode('Hello'));
        writer.close();
    }, 100);

    return new Response(readableStream);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![
            76, 111, 97, 100, 105, 110, 103, 46, 46, 46,
        ])),
    )
    .await;

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![72, 101, 108, 108, 111])),
    )
    .await;

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

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;

    utils::assert_run_result(&receiver, RunResult::Timeout).await;
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

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught ReferenceError: doesNotExists is not defined\n  at trigger (5:9)\n  at handler (8:5)".to_owned()
    )).await;
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

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught ReferenceError: doesNotExists is not defined\n  at 12:17\n  at stream (11:19)".to_owned()
    )).await;
}
