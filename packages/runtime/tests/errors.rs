use std::sync::Once;

use hyper::body::Bytes;
use lagon_runtime::{
    http::{Method, Request, RunResult},
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
async fn handler_reject() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    throw new Error('Rejected');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught Error: Rejected, at:\n    throw new Error('Rejected');".into())
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn compilation_error() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    this syntax is invalid
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught SyntaxError: Unexpected identifier 'syntax', at:\n    this syntax is invalid"
                .into()
        ),
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn timeout_reached() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    while(true) {}
    return new Response('Should not be reached');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(rx.recv_async().await.unwrap(), RunResult::Timeout);
}

#[tokio::test(flavor = "multi_thread")]
async fn memory_reached() {
    setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    const storage = [];
    const twoMegabytes = 1024 * 1024 * 2;
    while (true) {
        const array = new Uint8Array(twoMegabytes);
        for (let ii = 0; ii < twoMegabytes; ii += 4096) {
        array[ii] = 1; // we have to put something in the array to flush to real memory
        }
        storage.push(array);
    }
    return new Response('Should not be reached');
}"
            .into(),
        )
        // Increase timeout for CI
        .with_timeout(1000)
        .with_memory(1),
    );
    let (tx, rx) = flume::unbounded();
    isolate
        .run(
            Request {
                body: Bytes::new(),
                headers: None,
                method: Method::GET,
                url: "".into(),
            },
            tx,
        )
        .await;

    assert_eq!(rx.recv_async().await.unwrap(), RunResult::MemoryLimit);
}
