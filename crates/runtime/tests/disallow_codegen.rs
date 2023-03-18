use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, IsolateRequest};

mod utils;

#[tokio::test]
async fn disallow_eval() {
    utils::setup();
    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export function handler() {
    const result = eval('1 + 1')
    return new Response(result)
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );

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
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
            ));
        }
    }
}

#[tokio::test]
async fn disallow_function() {
    utils::setup();
    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export function handler() {
    const result = new Function('return 1 + 1')
    return new Response(result())
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );

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
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught EvalError: Code generation from strings disallowed for this context\n  at handler (2:20)".into()
            ));
        }
    }
}
