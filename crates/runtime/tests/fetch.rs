use httptest::{matchers::*, responders::*, Expectation, Server};
use hyper::{header::CONTENT_TYPE, Body, Request, Response};
use lagon_runtime_http::RunResult;
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

#[tokio::test]
async fn basic_fetch() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}').then(res => res.text());
    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn request_method() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("POST", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'POST'
    }}).then(res => res.text());

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn request_method_fallback() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("UNKNOWN", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'UNKNOWN'
    }}).then(res => res.text());

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn request_headers() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("GET", "/"),
            request::headers(contains(("x-token", "hello")))
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        headers: {{
            'x-token': 'hello'
        }}
    }}).then(res => res.text());

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn request_headers_class() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("GET", "/"),
            request::headers(contains(("x-token", "hello")))
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        headers: new Headers({{
            'x-token': 'hello'
        }})
    }}).then(res => res.text());

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn request_body() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("POST", "/"),
            request::body("Hello!")
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch('{url}', {{
        method: 'POST',
        body: 'Hello!'
    }}).then(res => res.text());

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn response_headers() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).insert_header("x-token", "hello")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
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
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("content-length: 0 content-type: text/plain;charset=UTF-8 x-token: hello"),
    )
    .await;
}

#[tokio::test]
async fn response_status() {
    utils::setup();
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

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.text();

    return new Response(`${{body}}: ${{response.status}}`);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Moved: 200"),
    )
    .await;
}

#[tokio::test]
async fn response_json() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body(r#"{"hello":"world"}"#)),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.json();

    return new Response(`${{typeof body}} ${{JSON.stringify(body)}}`);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from(r#"object {"hello":"world"}"#),
    )
    .await;
}

#[tokio::test]
async fn response_array_buffer() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const response = await fetch('{url}');
    const body = await response.arrayBuffer();

    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(&receiver, Response::builder(), Body::from("Hello, World")).await;
}

#[tokio::test]
async fn throw_invalid_url() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {
    const response = await fetch('doesnotexist');
    const body = await response.text();

    return new Response(body);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught Error: builder error: relative URL without a base".into()),
    )
    .await;
}

#[tokio::test]
async fn throw_invalid_header() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught Error: failed to parse header value".into()),
    )
    .await;
}

#[tokio::test]
async fn abort_signal() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
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
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Aborted"),
    )
    .await;
}

#[tokio::test]
async fn redirect() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .respond_with(status_code(301).append_header("Location", "https://google.com")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("200"),
    )
    .await;
}

#[tokio::test]
async fn redirect_relative_url() {
    utils::setup();
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

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("200"),
    )
    .await;
}

#[tokio::test]
async fn redirect_loop() {
    utils::setup();
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

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const status = (await fetch('{url}')).status;
    return new Response(status);
}}"
    )));
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught Error: error following redirect: Too many redirects".into()),
    )
    .await;
}

#[tokio::test]
async fn limit_fetch_calls() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(request::method_path("GET", "/"))
            .times(21)
            .respond_with(status_code(200)),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
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
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught Error: fetch() can only be called 20 times per requests".into()),
    )
    .await;

    // Test if we can still call fetch in subsequent requests
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error("Uncaught Error: fetch() can only be called 20 times per requests".into()),
    )
    .await;

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("ok"),
    )
    .await;
}

#[tokio::test]
async fn fetch_https() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export async function handler() {{
    const status = (await fetch('https://google.com')).status;
    return new Response(status);
}}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("200"),
    )
    .await;

    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
}

#[tokio::test]
async fn fetch_set_content_length() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            any_of![
                request::method_path("POST", "/"),
                request::method_path("PUT", "/")
            ],
            request::headers(contains(("content-length", "0")))
        ])
        .times(2)
        .respond_with(status_code(200)),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    await fetch('{url}', {{
        method: 'POST',
    }});

    await fetch('{url}', {{
        method: 'PUT',
    }});

    return new Response('Ok');
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Ok"),
    )
    .await;
}

#[tokio::test]
async fn fetch_input_request() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("POST", "/"),
            request::headers(contains(("x-token", "hello"))),
            request::body("Hello!"),
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch(new Request('{url}', {{
        method: 'POST',
        headers: {{
            'x-token': 'hello'
        }},
        body: 'Hello!'
    }})).then(res => res.text());
    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}

#[tokio::test]
async fn fetch_input_request_init() {
    utils::setup();
    let server = Server::run();
    server.expect(
        Expectation::matching(all_of![
            request::method_path("POST", "/"),
            request::headers(contains(("x-token", "hello"))),
            request::body("Hello!"),
        ])
        .respond_with(status_code(200).body("Hello, World")),
    );
    let url = server.url("/");

    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "export async function handler() {{
    const body = await fetch(new Request('{url}', {{
        method: 'GET',
        headers: {{
            'hello': 'world'
        }},
        body: 'No'
    }}), {{
        method: 'POST',
        headers: {{
            'x-token': 'hello'
        }},
        body: 'Hello!'
    }}).then(res => res.text());
    return new Response(body);
}}"
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("Hello, World"),
    )
    .await;
}
