use std::sync::Once;

use httptest::{matchers::*, responders::*, Expectation, Server};
use lagon_runtime::{
    http::{Request, Response, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test(flavor = "multi_thread")]
async fn basic_fetch() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}').then(res => res.text());
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

#[tokio::test(flavor = "multi_thread")]
async fn request_method() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("POST", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'POST'
    }}).then(res => res.text());

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

#[tokio::test(flavor = "multi_thread")]
async fn request_method_fallback() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'UNKNOWN'
    }}).then(res => res.text());

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

#[tokio::test(flavor = "multi_thread")]
async fn request_headers() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("GET", "/"),
            request::headers(contains(("x-token", "hello")))
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        headers: {{
            'x-token': 'hello'
        }}
    }}).then(res => res.text());

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

#[tokio::test(flavor = "multi_thread")]
async fn request_headers_class() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("GET", "/"),
            request::headers(contains(("x-token", "hello")))
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        headers: new Headers({{
            'x-token': 'hello'
        }})
    }}).then(res => res.text());

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

#[tokio::test(flavor = "multi_thread")]
async fn request_body() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("POST", "/"),
            request::body("Hello!")
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'POST',
        body: 'Hello!'
    }}).then(res => res.text());

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

#[tokio::test(flavor = "multi_thread")]
async fn response_headers() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).insert_header("x-token", "hello")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = [];

    for (const [key, value] of response.headers.entries()) {{
        // The date is different at each call so we skip it
        if (key === 'date') continue;

        body.push(`${{key}}: ${{value}}`);
    }}

    return new Response(body.sort((a, b) => a.localeCompare(b)).join(' '));
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("content-length: 0 x-token: hello"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn response_status() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(302).body("Moved")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.text();

    return new Response(`${{body}}: ${{response.status}}`);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Moved: 302"))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn response_json() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body(r#"{"hello":"world"}"#)),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.json();

    return new Response(`${{typeof body}} ${{JSON.stringify(body)}}`);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from(r#"object {"hello":"world"}"#))
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn response_array_buffer() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.arrayBuffer();

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

#[tokio::test(flavor = "multi_thread")]
async fn throw_invalid_url() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const response = await fetch('doesnotexist');
    const body = await response.text();

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught Error: client requires absolute-form URIs, at:\n        throw new Error(error);"
                .into()
        )
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn throw_invalid_header() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const response = await fetch('http://localhost:5555/', {
        headers: {
            'foo': 'bar\\r\\n'
        }
    });
    const body = await response.text();

    return new Response(body);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught Error: failed to parse header value, at:\n        throw new Error(error);"
                .into()
        )
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn abort_signal() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const controller = new AbortController();
    const signal = controller.signal;

    const promise = fetch('{url}', {{
        signal,
    }}).then(res => res.text()).catch(error => error.message);

    controller.abort();
    const body = await promise;

    return new Response(body);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Aborted"))
    );
}
