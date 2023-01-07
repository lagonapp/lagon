use httptest::bytes::Bytes;
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Method, Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use std::sync::Once;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test]
async fn no_handler() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new("console.log('Hello')".into()));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught Error: Handler function is not defined or is not a function".into()
        )
    );
}

#[tokio::test]
async fn handler_not_function() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new("export const handler = 'Hello'".into()));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught Error: Handler function is not defined or is not a function".into()
        )
    );
}

#[tokio::test]
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
        RunResult::Error("Uncaught Error: Rejected\n  at handler (2:11)".into())
    );
}

#[tokio::test]
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
        RunResult::Error("Uncaught SyntaxError: Unexpected identifier 'syntax'".into()),
    );
}

#[tokio::test]
async fn import_errors() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "import test from 'test';

export function handler() {
    return new Response('hello world');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught Error: Can't import modules, everything should be bundled in a single file"
                .into()
        ),
    );
}

#[tokio::test]
async fn execution_timeout_reached() {
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

#[tokio::test]
async fn init_timeout_reached() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "while(true) {}
export function handler() {
    return new Response('Should not be reached');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(rx.recv_async().await.unwrap(), RunResult::Timeout);
}

#[tokio::test]
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
        .startup_timeout(10000)
        .memory(1),
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

#[tokio::test]
async fn stacktrace() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "function test(a) {
    return a() / 1;
}

function first(a) {
    return test(a);
}

export function handler() {
    return new Response(first('a'));
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught TypeError: a is not a function\n  at test (2:12)\n  at first (6:12)\n  at handler (10:25)".into(),
    ));
}
