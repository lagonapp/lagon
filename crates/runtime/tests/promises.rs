use httptest::{matchers::*, responders::*, Expectation, Server};
use hyper::{header::CONTENT_TYPE, Request, Response};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn execute_async_handler() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    return new Response('Async handler');
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Async handler".into())
            .unwrap(),
    )
    .await;
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

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}').then((res) => res.text());
    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello, World".into())
            .unwrap(),
    )
    .await;
}
