use std::sync::Once;

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

    assert_eq!(
        isolate.run(Request::default()).await.0,
        RunResult::Response(Response::from("Async handler"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn execute_promise() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const body = await fetch('http://google.com').then((res) => res.text());
    return new Response(body);
}"
        .into(),
    ));

    assert_eq!(
        isolate.run(Request::default()).await.0,
        RunResult::Response(Response::default())
    );
}
