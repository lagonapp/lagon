use hyper::{header::CONTENT_TYPE, Body, Request, Response};
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

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("2"),
    )
    .await;
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

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("2"),
    )
    .await;
}
