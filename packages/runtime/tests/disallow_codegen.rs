use std::sync::Once;

use lagon_runtime::{
    http::{Request, RunResult},
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
async fn disallow_eval() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const result = eval('1 + 1')
    return new Response(result)
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught EvalError: Code generation from strings disallowed for this context, at:\n    const result = eval('1 + 1')".into())
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn disallow_function() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught EvalError: Code generation from strings disallowed for this context, at:\n    const result = new Function('return 1 + 1')".into())
    );
}

