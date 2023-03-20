use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;
use std::time::Duration;

mod utils;

#[tokio::test]
async fn no_handler() {
    utils::setup();
    let (mut isolate, send, receiver) =
        utils::create_isolate(IsolateOptions::new("console.log('Hello')".into()));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught Error: Handler function is not defined or is not a function".into()
            ));
        }
    }
}

#[tokio::test]
async fn handler_not_function() {
    utils::setup();
    let (mut isolate, send, receiver) =
        utils::create_isolate(IsolateOptions::new("export const handler = 'Hello'".into()));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught Error: Handler function is not defined or is not a function".into()
            ));
        }
    }
}

#[tokio::test]
async fn handler_reject() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    throw new Error('Rejected');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught Error: Rejected\n  at handler (2:11)".into()
            ));
        }
    }
}

#[tokio::test]
async fn compilation_error() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    this syntax is invalid
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught SyntaxError: Unexpected identifier 'syntax'".into()
            ));
        }
    }
}

#[tokio::test]
async fn import_errors() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "import test from 'test';

export function handler() {
    return new Response('hello world');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error(
                "Uncaught Error: Can't import modules, everything should be bundled in a single file".into()
            ));
        }
    }
}

#[tokio::test]
async fn execution_timeout_reached() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "export function handler() {
    while(true) {}
    return new Response('Should not be reached');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Timeout);
        }
    }
}

#[tokio::test]
async fn init_timeout_reached() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "while(true) {}
export function handler() {
    return new Response('Should not be reached');
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Timeout);
        }
    }
}

#[tokio::test]
async fn memory_reached() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
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
        // Increase timeout for CI
        .startup_timeout(Duration::from_millis(10000))
        .memory(1),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Timeout);
        }
    }
}

#[tokio::test]
async fn stacktrace() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(IsolateOptions::new(
        "function test(a) {
    return a() / 1;
}

function first(a) {
    return test(a);
}

export function handler() {
    return new Response(first('a'));
}"
        .into(),
    ));
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error("Uncaught TypeError: a is not a function\n  at test (2:12)\n  at first (6:12)\n  at handler (10:25)".into()));
        }
    }
}
