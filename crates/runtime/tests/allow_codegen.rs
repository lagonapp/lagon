use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn allow_eval() {
    utils::setup_allow_codegen();
    let (mut isolate, send, receiver) =
        utils::create_isolate_without_snapshot(IsolateOptions::new(
            "export function handler() {
const result = eval('1 + 1')
return new Response(result)
}"
            .into(),
        ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("2")));
        }
    }
}

#[tokio::test]
async fn allow_function() {
    utils::setup_allow_codegen();
    let (mut isolate, send, receiver) =
        utils::create_isolate_without_snapshot(IsolateOptions::new(
            "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
            .into(),
        ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("2")));
        }
    }
}
