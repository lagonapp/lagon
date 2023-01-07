use httptest::{matchers::*, responders::*, Expectation, Server};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use std::sync::Once;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test]
async fn execute_async_handler() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    return new Response('Async handler');
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Async handler"))
    );
}

#[tokio::test]
async fn execute_promise() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}').then((res) => res.text());
    return new Response(body);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello, World"))
    );
}
