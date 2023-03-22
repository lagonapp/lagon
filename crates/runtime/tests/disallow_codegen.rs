use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn disallow_eval() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const result = eval('1 + 1')
    return new Response(result)
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(receiver.recv_async().await.unwrap(), RunResult::Error(
        "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
    ));
}

#[tokio::test]
async fn disallow_function() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(receiver.recv_async().await.unwrap(), RunResult::Error(
        "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
    ));
}
