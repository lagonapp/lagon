use httptest::bytes::Bytes;
use lagon_runtime_http::{Method, Request, Response, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;
use std::collections::HashMap;

mod utils;

#[tokio::test]
async fn execute_function() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn execute_function_twice() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }

    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn environment_variables() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
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

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn get_body() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.body);
}"
        .into(),
    ));
    send(Request {
        body: Bytes::from("Hello world"),
        headers: None,
        method: Method::GET,
        url: "".into(),
    });

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn get_input() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.url);
}"
        .into(),
    ));
    send(Request {
        body: Bytes::new(),
        headers: None,
        method: Method::GET,
        url: "https://hello.world".into(),
    });

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("https://hello.world")));
        }
    }
}

#[tokio::test]
async fn get_method() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.method);
}"
        .into(),
    ));
    send(Request {
        body: Bytes::new(),
        headers: None,
        method: Method::POST,
        url: "".into(),
    });

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("POST")));
        }
    }
}

#[tokio::test]
async fn get_headers() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.headers.get('x-auth'));
}"
        .into(),
    ));

    let mut headers = HashMap::new();
    headers.insert("x-auth".into(), vec!["token".into()]);

    send(Request {
        body: Bytes::new(),
        headers: Some(headers),
        method: Method::POST,
        url: "".into(),
    });

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("token")));
        }
    }
}

#[tokio::test]
async fn return_headers() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
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

    let mut headers = HashMap::new();
    headers.insert("content-type".into(), vec!["text/html".into()]);
    headers.insert("x-test".into(), vec!["test".into()]);

    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response {
                body: "Hello world".into(),
                headers: Some(headers),
                status: 200,
            }));
        }
    }
}

#[tokio::test]
async fn return_headers_from_headers_api() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
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

    let mut headers = HashMap::new();
    headers.insert("content-type".into(), vec!["text/html".into()]);
    headers.insert("x-test".into(), vec!["test".into()]);

    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response {
                body: "Hello world".into(),
                headers: Some(headers),
                status: 200,
            }));
        }
    }
}

#[tokio::test]
async fn return_status() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response('Moved permanently', {
        status: 302,
    });
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response {
                body: "Moved permanently".into(),
                headers: None,
                status: 302,
            }));
        }
    }
}

#[tokio::test]
async fn return_uint8array() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    // TextEncoder#encode returns a Uint8Array
    const body = new TextEncoder().encode('Hello world');
    return new Response(body);
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn console_log() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
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

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::default()));
        }
    }
}

#[tokio::test]
async fn atob() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response(atob('SGVsbG8='));
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello")));
        }
    }
}

#[tokio::test]
async fn btoa() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    return new Response(btoa('Hello'));
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("SGVsbG8=")));
        }
    }
}
