use std::{collections::HashMap, sync::Once};

use lagon_runtime::{
    http::{Method, Request, Response, RunResult},
    isolate::{Isolate, IsolateOptions},
};

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        let platform = v8::new_default_platform(0, false).make_shared();
        v8::V8::initialize_platform(platform);
        v8::V8::initialize();

        v8::V8::set_flags_from_string("--disallow-code-generation-from-strings");
    });
}

#[tokio::test]
async fn execute_function() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Hello world');
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn environment_variables() {
    setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    return new Response(process.env.TEST);
}"
            .into(),
        )
        .with_environment_variables(
            vec![("TEST".into(), "Hello world".into())]
                .into_iter()
                .collect(),
        ),
    );

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn get_body() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.body);
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "Hello world".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn get_input() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.url);
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "https://hello.world".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "https://hello.world".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn get_method() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.method);
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::POST,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "POST".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn get_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler(request) {
    return new Response(request.headers.get('x-auth'));
}"
        .into(),
    ));

    let mut headers = HashMap::new();
    headers.insert("x-auth".into(), "token".into());

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers,
                method: Method::POST,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "token".into(),
            headers: None,
            status: 200,
        })
    );
}

#[tokio::test]
async fn return_headers() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
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
    headers.insert("Content-Type".into(), "text/html".into());
    headers.insert("X-Test".into(), "test".into());

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: Some(headers),
            status: 200,
        })
    );
}

#[tokio::test]
async fn return_headers_from_headers_api() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
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
    headers.insert("Content-Type".into(), "text/html".into());
    headers.insert("X-Test".into(), "test".into());

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Hello world".into(),
            headers: Some(headers),
            status: 200,
        })
    );
}

#[tokio::test]
async fn return_status() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    return new Response('Moved permanently', {
        status: 302,
    });
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Response(Response {
            body: "Moved permanently".into(),
            headers: None,
            status: 302,
        })
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn timeout_reached() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export function handler() {
    while(true) {}
    return new Response('Should not be reached');
}"
        .into(),
    ));

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::Timeout(),
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn memory_reached() {
    setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export function handler() {
    const storage = [];
    const twoMegabytes = 1024 * 1024 * 2;
    while (true) {
        const array = new Uint8Array(twoMegabytes);
        for (let ii = 0; ii < twoMegabytes; ii += 4096) {
        array[ii] = 1; // we have to put something in the array to flush to real memory
        }
        storage.push(array);
    }
    return new Response('Should not be reached');
}"
            .into(),
        )
        .with_timeout(1000),
    ); // Increase timeout for CI

    assert_eq!(
        isolate
            .run(Request {
                body: "".into(),
                headers: HashMap::new(),
                method: Method::GET,
                url: "".into(),
            })
            .0,
        RunResult::MemoryLimit(),
    );
}
