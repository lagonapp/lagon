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

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
async fn response_status() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(302).append_header("location", "/moved")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/moved"))
            .respond_with(status_code(200).body("Moved")),
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
        RunResult::Response(Response::from("Moved: 200"))
    );
}

#[tokio::test]
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

#[tokio::test]
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

#[tokio::test]
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
        RunResult::Error("Uncaught Error: client requires absolute-form URIs".into())
    );
}

#[tokio::test]
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
        RunResult::Error("Uncaught Error: failed to parse header value".into())
    );
}

#[tokio::test]
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

#[tokio::test]
async fn redirect() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(301).append_header("Location", "https://google.com")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("200"))
    );
}

#[tokio::test]
async fn redirect_relative_url() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(301).append_header("Location", "/redirected")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/redirected"))
            .respond_with(status_code(200)),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("200"))
    );
}

#[tokio::test]
async fn redirect_without_location_header() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/")).respond_with(status_code(301)),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught Error: Got a redirect without Location header".into())
    );
}

#[tokio::test]
async fn redirect_loop() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(301).append_header("location", "/a")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/a"))
            .respond_with(status_code(301).append_header("location", "/b")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/b"))
            .respond_with(status_code(301).append_header("location", "/c")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/c"))
            .respond_with(status_code(301).append_header("location", "/d")),
    );
    server.expect(
        Expectation::matching(request::method_path("GET", "/d"))
            .respond_with(status_code(301).append_header("location", "/e")),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught Error: Too many redirects".into())
    );
}

#[tokio::test]
async fn limit_fetch_calls() {
    setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .times(21)
            .respond_with(status_code(200)),
    );
    let url = server.url("/");

    let mut isolate = Isolate::new(IsolateOptions::new(format!(
        "let pass = false;
export async function handler() {{
    if (!pass) {{
        pass = true
        while (true) {{
            await fetch('{url}');
        }}
        return new Response('done');
    }}
    await fetch('{url}');
    return new Response('ok')
}}"
    )));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx.clone()).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error("Uncaught Error: fetch() can only be called 20 times per requests".into())
    );
    assert!(rx.try_recv().is_err());

    // Test if we can still call fetch in subsequent requests
    isolate.run(Request::default(), tx).await;
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("ok"))
    );
    assert!(rx.try_recv().is_err());
}
