use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn allow_eval() {
    utils::setup_allow_codegen();
    let (send, receiver) = utils::create_isolate_without_snapshot(IsolateOptions::new(
        "export function handler() {
const result = eval('1 + 1')
return new Response(result)
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("2"))
    );
}

#[tokio::test]
async fn allow_function() {
    utils::setup_allow_codegen();
    let (send, receiver) = utils::create_isolate_without_snapshot(IsolateOptions::new(
        "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("2"))
    );
}
