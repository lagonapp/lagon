use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};

mod utils;

#[tokio::test]
async fn disallow_eval() {
    utils::setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    const result = eval('1 + 1')
    return new Response(result)
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
        )
    );
}

#[tokio::test]
async fn disallow_function() {
    utils::setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
        )
    );
}
