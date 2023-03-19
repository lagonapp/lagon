use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::options::IsolateOptions;
use serial_test::serial;

mod utils;

#[tokio::test]
async fn set_timeout() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    const test = await new Promise((resolve) => {
        setTimeout(() => {
            resolve('test');
        }, 100);
    });
    return new Response(test);
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("test")));
        }
    }
}

#[tokio::test]
#[serial]
async fn set_timeout_not_blocking_response() {
    utils::setup();
    let log_rx = utils::setup_logger();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    console.log('before')
    setTimeout(() => {
        console.log('done')
    }, 100);
    console.log('after')

    return new Response('Hello!');
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin"))
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "before".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello!")));
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "after".to_string());
        }
    }
}

#[tokio::test]
async fn set_timeout_clear() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    let id;
    const test = await new Promise((resolve) => {
        id = setTimeout(() => {
            resolve('first');
        }, 100);
        setTimeout(() => {
            resolve('second');
        }, 200);
        clearTimeout(id);
    });
    return new Response(test);
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("second")));
        }
    }
}

#[tokio::test]
async fn set_timeout_clear_correct() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    const test = await new Promise((resolve) => {
        setTimeout(() => {
            resolve('first');
        }, 100);
        const id = setTimeout(() => {
            resolve('second');
        }, 200);
        clearTimeout(id);
    });
    return new Response(test);
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin")),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("first")));
        }
    }
}

#[tokio::test]
#[serial]
async fn set_interval() {
    let log_rx = utils::setup_logger();
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    await new Promise(resolve => {
        let count = 0;
        const id = setInterval(() => {
            count++;
            console.log('interval', count);

            if (count >= 3) {
                clearInterval(id);
                resolve();
            }
        }, 100);
    });

    console.log('res');
    return new Response('Hello world');
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin"))
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "interval 1".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "interval 2".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "interval 3".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "res".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
#[serial]
async fn queue_microtask() {
    let log_rx = utils::setup_logger();
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    queueMicrotask(() => {
        console.log('microtask');
    });

    console.log('before')

    return new Response('Hello world');
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin"))
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "before".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "microtask".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}

#[tokio::test]
async fn queue_microtask_throw_not_function() {
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    queueMicrotask(true);
    return new Response('Hello world');
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin"))
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Error("Uncaught TypeError: Parameter 1 is not of type 'Function'\n  at handler (2:5)".into()));
        }
    }
}

#[tokio::test]
#[serial]
async fn timers_order() {
    let log_rx = utils::setup_logger();
    utils::setup();
    let (mut isolate, send, receiver) = utils::create_isolate(
        IsolateOptions::new(
            "export async function handler() {
    queueMicrotask(() => {
        console.log('microtask')
    })

    Promise.resolve().then(() => {
        console.log('promise')
    })

    console.log('main');

    await new Promise(resolve => setTimeout(() => {
        console.log('timeout')
        resolve()
    }, 0))

    console.log('main 2');

    return new Response('Hello world');
}"
            .into(),
        )
        .snapshot_blob(include_bytes!("../../serverless/snapshot.bin"))
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    send(Request::default());

    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "main".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "microtask".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "promise".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "timeout".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = log_rx.recv_async() => {
            assert_eq!(result.unwrap(), "main 2".to_string());
        }
    }
    tokio::select! {
        _ = isolate.run_event_loop() => {}
        result = receiver.recv_async() => {
            assert_eq!(result.unwrap(), RunResult::Response(Response::from("Hello world")));
        }
    }
}
