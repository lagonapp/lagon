use httptest::{matchers::*, responders::*, Expectation, Server};
use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, IsolateRequest};

mod utils;

#[tokio::test]
async fn execute_async_handler() {
    utils::setup();
    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    return new Response('Async handler');
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
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Async handler")));
        }
    }
}

#[tokio::test]
async fn execute_promise() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (mut isolate, request_tx, sender, receiver) = utils::create_isolate(
        IsolateOptions::new(format!(
            "export async function handler() {{
    const body = await fetch('{url}').then((res) => res.text());
    return new Response(body);
}}"
        ))
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
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello, World")));
        }
    }
}
