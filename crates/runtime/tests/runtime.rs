use httptest::bytes::Bytes;
use lagon_runtime_http::{Method, Request, Response, RunResult, StreamResult};
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );

    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
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
    send(Request {
        body: Bytes::from("Hello world"),
        headers: Some(vec![(
            "content-type".into(),
            vec!["text/plain;charset=UTF-8".into()],
        )]),
        method: Method::GET,
        url: "".into(),
    });

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Data(vec![
            72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100
        ]))
    );
    assert!(receiver.recv_async().await.unwrap().as_stream_done());
    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Stream(StreamResult::Start(Response {
            headers: None,
            body: Bytes::from("[object ReadableStream]"),
            status: 200,
        }))
    );
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
    send(Request {
        body: Bytes::from("Hello world"),
        headers: Some(vec![(
            "content-type".into(),
            vec!["text/plain;charset=UTF-8".into()],
        )]),
        method: Method::GET,
        url: "".into(),
    });

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
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
    send(Request {
        body: Bytes::new(),
        headers: Some(vec![(
            "content-type".into(),
            vec!["text/plain;charset=UTF-8".into()],
        )]),
        method: Method::GET,
        url: "https://hello.world".into(),
    });

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("https://hello.world")
    );
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
    send(Request {
        body: Bytes::new(),
        headers: Some(vec![(
            "content-type".into(),
            vec!["text/plain;charset=UTF-8".into()],
        )]),
        method: Method::POST,
        url: "".into(),
    });

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("POST")
    );
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
    send(Request {
        body: Bytes::new(),
        headers: Some(vec![("x-auth".into(), vec!["token".into()])]),
        method: Method::POST,
        url: "".into(),
    });

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("token")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response {
            body: "Hello world".into(),
            headers: Some(vec![
                ("content-type".into(), vec!["text/html".into()]),
                ("x-test".into(), vec!["test".into()])
            ]),
            status: 200,
        }
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response {
            body: "Hello world".into(),
            headers: Some(vec![
                ("content-type".into(), vec!["text/html".into()]),
                ("x-test".into(), vec!["test".into()])
            ]),
            status: 200,
        }
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response {
            body: "Moved permanently".into(),
            headers: Some(vec![(
                "content-type".into(),
                vec!["text/plain;charset=UTF-8".into()],
            )]),
            status: 302,
        }
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response {
            body: "Hello world".into(),
            ..Default::default()
        }
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello")
    );
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

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("SGVsbG8=")
    );
}
