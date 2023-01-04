use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use std::sync::Once;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test]
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
        RunResult::Error(
            "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (4:20)".into()
        )
    );
}

#[tokio::test]
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
        RunResult::Error(
            "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (4:20)".into()
        )
    );
}
