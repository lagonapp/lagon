use hyper::{header::CONTENT_TYPE, Request, Response};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

// Tests ported from https://github.com/tc39/proposal-async-context/blob/master/tests/async-context.test.ts
#[tokio::test]
async fn inital_undefined() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "const ctx = new AsyncContext();
const actual = ctx.get();

if (actual !== undefined) {
    throw new Error('Expected undefined');
}

export function handler() {
    return new Response(actual === undefined);
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("true".into())
            .unwrap(),
    )
    .await;
}

#[tokio::test]
async fn return_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "const ctx = new AsyncContext();
const expected = { id: 1 };
const actual = ctx.run({ id: 2 }, () => expected);

if (actual !== expected) {
    throw new Error('Expected expected');
}

export function handler() {
    return new Response();
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(&receiver, Response::default()).await;
}

#[tokio::test]
async fn get_returns_current_context_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "const ctx = new AsyncContext();
const expected = { id: 1 };

ctx.run(expected, () => {
    if (ctx.get() !== expected) {
        throw new Error('Expected expected');
    }
});

export function handler() {
    return new Response();
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(&receiver, Response::default()).await;
}

#[tokio::test]
#[serial_test::serial]
async fn get_within_nesting_contexts() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "const ctx = new AsyncContext();
const first = { id: 1 };
const second = { id: 2 };

ctx.run(first, () => {
    if (ctx.get() !== first) {
        throw new Error('Expected first');
    }
    ctx.run(second, () => {
        if (ctx.get() !== second) {
            throw new Error('Expected second');
        }
    });
    if (ctx.get() !== first) {
        throw new Error('Expected first');
    }
});

if (ctx.get() !== undefined) {
    throw new Error('Expected undefined');
}

export function handler() {
    return new Response();
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(&receiver, Response::default()).await;
}

#[tokio::test]
#[serial_test::serial]
async fn get_within_nesting_different_contexts() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "const a = new AsyncContext();
const b = new AsyncContext();
const first = { id: 1 };
const second = { id: 2 };

a.run(first, () => {
    if (a.get() !== first) {
        throw new Error('Expected first');
    }
    if (b.get() !== undefined) {
        throw new Error('Expected undefined');
    }
    b.run(second, () => {
        if (a.get() !== first) {
            throw new Error('Expected first');
        }
        if (b.get() !== second) {
            throw new Error('Expected second');
        }
    });
    if (a.get() !== first) {
        throw new Error('Expected first');
    }
    if (b.get() !== undefined) {
        throw new Error('Expected undefined');
    }
});
if (a.get() !== undefined) {
    throw new Error('Expected undefined');
}
if (b.get() !== undefined) {
    throw new Error('Expected undefined');
}

export function handler() {
    return new Response();
}"
        .into(),
    ));
    send(Request::default());

    utils::assert_response(&receiver, Response::default()).await;
}

#[tokio::test]
#[serial_test::serial]
async fn timers() {
    utils::setup();
    let (logs_sender, logs_receiver) = flume::unbounded();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "const store = new AsyncLocalStorage();
let id = 1;
export async function handler() {
    const result = store.run(id++, () => {
        setTimeout(() => {
            console.log(store.getStore() * 2);
        }, 100);

        return store.getStore() * 2;
    });
    // Make sure the console.log is executed before returning the response
    await new Promise((resolve) => setTimeout(resolve, 150));

    return new Response(result);
}"
            .into(),
        )
        .log_sender(logs_sender),
    );
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("2".into())
            .unwrap(),
    )
    .await;

    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder()
            .header(CONTENT_TYPE, "text/plain;charset=UTF-8")
            .body("4".into())
            .unwrap(),
    )
    .await;

    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "2".into(), None)
    );
}
