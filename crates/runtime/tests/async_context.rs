use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

// Tests ported from https://github.com/tc39/proposal-async-context/blob/master/tests/async-context.test.ts
#[tokio::test]
async fn inital_undefined() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const ctx = new AsyncContext();
    const actual = ctx.get();
    return new Response(actual === undefined);
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test]
async fn return_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const ctx = new AsyncContext();
    const expected = { id: 1 };
    const actual = ctx.run({ id: 2 }, () => expected);
    return new Response(actual === expected);
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test]
async fn get_returns_current_context_value() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    const ctx = new AsyncContext();
    const expected = { id: 1 };

    return ctx.run(expected, () => {
        return new Response(ctx.get() === expected);
    });
}"
        .into(),
    ));
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test]
#[serial_test::serial]
async fn get_within_nesting_contexts() {
    utils::setup();
    let log_rx = utils::setup_logger();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export function handler() {
    const ctx = new AsyncContext();
    const first = { id: 1 };
    const second = { id: 2 };

    ctx.run(first, () => {
        console.log(1, ctx.get() === first);
        ctx.run(second, () => {
            console.log(2, ctx.get() === second);
        });
        console.log(3, ctx.get() === first);
    });
    return new Response(ctx.get() === undefined);
}"
            .into(),
        )
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    for _ in 1..=3 {
        assert!(log_rx.recv_async().await.unwrap().contains("true"));
    }
    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test]
#[serial_test::serial]
async fn get_within_nesting_different_contexts() {
    utils::setup();
    let log_rx = utils::setup_logger();
    let (send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export function handler() {
    const a = new AsyncContext();
    const b = new AsyncContext();
    const first = { id: 1 };
    const second = { id: 2 };

    a.run(first, () => {
      console.log(1, a.get() === first);
      console.log(2, b.get() === undefined);
      b.run(second, () => {
        console.log(3, a.get() === first);
        console.log(4, b.get() === second);
      });
      console.log(5, a.get() === first);
      console.log(6, b.get() === undefined);
    });
    return new Response(a.get() === undefined && b.get() === undefined);
}"
            .into(),
        )
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    for i in 1..=6 {
        assert!(log_rx.recv_async().await.unwrap().contains("true"));
    }
    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("true"))
    );
}

#[tokio::test]
#[serial_test::serial]
async fn timers() {
    utils::setup();
    let log_rx = utils::setup_logger();
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
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("2"))
    );

    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap(),
        RunResult::Response(Response::from("4"))
    );

    assert_eq!(log_rx.recv_async().await.unwrap(), "2");
}
