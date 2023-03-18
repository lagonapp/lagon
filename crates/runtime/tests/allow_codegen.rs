use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, IsolateRequest};

mod utils;

#[tokio::test]
async fn allow_eval() {
    utils::setup_allow_codegen();
    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
const result = eval('1 + 1')
return new Response(result)
}"
        .into(),
    ));
    request_tx
        .send_async(IsolateRequest {
            request: Request::default(),
            sender,
        })
        .await
        .unwrap();

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
    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
        .into(),
    ));
    request_tx
        .send_async(IsolateRequest {
            request: Request::default(),
            sender,
        })
        .await
        .unwrap();

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("2")));
        }
    }
}
