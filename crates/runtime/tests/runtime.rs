use hyper::{
    header::{CONTENT_TYPE, HOST},
    Body, Method, Request, Response,
};
use lagon_runtime_http::{RunResult, StreamResult};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn execute_function() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn execute_function_export_as() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "function hello() {
    return new Response('Hello world');
}

export { hello as handler }"
            .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn execute_function_twice() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;

    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn environment_variables() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export function handler() {
    return new Response(process.env.TEST);
}"
            .into(),
        )
        .environment_variables(
            vec![("TEST".into(), "Hello world".into())]
                .into_iter()
                .collect(),
        ),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn get_body_streaming() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.body);
}"
        .into(),
    ));
    send(
        Request::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    );

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Data(vec![
            72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
        ])),
    )
    .await;

    assert!(receiver.recv_async().await.unwrap().as_stream_done());

    utils::assert_run_result(
        &receiver,
        RunResult::Stream(StreamResult::Start(Response::builder())),
    )
    .await;
}

#[tokio::test]
async fn get_body() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler(request) {
    return new Response(await request.text());
}"
        .into(),
    ));
    send(
        Request::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    );

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn get_input() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.url);
}"
        .into(),
    ));
    send(
        Request::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .header(HOST, "hello.world")
            .uri("/hello")
            .body("Hello world".into())
            .unwrap(),
    );

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("https://hello.world/hello".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn get_method() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.method);
}"
        .into(),
    ));
    send(
        Request::builder()
            .method(Method::POST)
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body(Body::empty())
            .unwrap(),
    );

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("POST".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn get_headers() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.headers.get('x-auth'));
}"
        .into(),
    ));
    send(
        Request::builder()
            .header("x-auth", "token")
            .body(Body::empty())
            .unwrap(),
    );

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("token".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn return_headers() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world', {
        headers: {
            'Content-Type': 'text/html',
            'X-Test': 'test',
        }
    });
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/html")
            .header("x-test", "test")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn return_headers_from_headers_api() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world', {
        headers: new Headers({
            'Content-Type': 'text/html',
            'X-Test': 'test',
        })
    });
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/html")
            .header("x-test", "test")
            .body("Hello world".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn return_status() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Moved permanently', {
        status: 302,
    });
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .status(302)
            .body("Moved permanently".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn return_uint8array() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    // TextEncoder#encode returns a Uint8Array
    const body = new TextEncoder().encode('Hello world');
    return new Response(body);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().body("Hello world".into()).unwrap(),
    )
    .await;
}

#[tokio::test]
async fn console_log() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const types = ['log', 'info', 'debug', 'error', 'warn'];

    types.forEach(type => {
        console[type]('Hello world!')
    })

    return new Response('');
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn atob() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response(atob('SGVsbG8='));
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("Hello".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn btoa() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response(btoa('Hello'));
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("SGVsbG8=".into())
            .unwrap(),
    )
    .await;
}
