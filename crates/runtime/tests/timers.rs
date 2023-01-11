use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, Response, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use serial_test::serial;
use std::sync::Once;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

static mut RX: Option<flume::Receiver<String>> = None;

fn setup_logger() -> flume::Receiver<String> {
    static START: Once = Once::new();

    START.call_once(|| {
        let (tx, rx) = flume::unbounded();

        struct Logger {
            tx: flume::Sender<String>,
        }

        impl log::Log for Logger {
            fn enabled(&self, _metadata: &log::Metadata) -> bool {
                true
            }
            fn log(&self, record: &log::Record) {
                self.tx.send(record.args().to_string()).unwrap();
            }
            fn flush(&self) {}
        }

        log::set_boxed_logger(Box::new(Logger { tx })).unwrap();
        log::set_max_level(log::LevelFilter::Info);

        unsafe { RX = Some(rx) };
    });

    unsafe { RX.clone() }.unwrap()
}

#[tokio::test]
async fn set_timeout() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
        "export async function handler() {
    const test = await new Promise((resolve) => {
        setTimeout(() => {
            resolve('test');
        }, 100);
    });
    return new Response(test);
}"
        .into(),
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("test"))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn set_timeout_not_blocking_response() {
    setup();
    let log_rx = setup_logger();
    let mut isolate = Isolate::new(
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
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(log_rx.recv_async().await.unwrap(), "before".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "after".to_string());
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello!"))
    );
    assert!(rx.recv_async().await.is_err());
    assert!(log_rx.try_recv().is_err());
}

#[tokio::test]
async fn set_timeout_clear() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
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
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("second"))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test]
async fn set_timeout_clear_correct() {
    setup();
    let mut isolate = Isolate::new(IsolateOptions::new(
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
    ));
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("first"))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn set_interval() {
    let log_rx = setup_logger();
    setup();
    let mut isolate = Isolate::new(
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
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(log_rx.recv_async().await.unwrap(), "interval 1".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "interval 2".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "interval 3".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "res".to_string());
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test]
#[serial]
async fn queue_microtask() {
    let log_rx = setup_logger();
    setup();
    let mut isolate = Isolate::new(
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
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(log_rx.recv_async().await.unwrap(), "before".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "microtask".to_string());
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test]
#[serial]
async fn queue_microtask_throw_not_function() {
    setup();
    let mut isolate = Isolate::new(
        IsolateOptions::new(
            "export async function handler() {
    queueMicrotask(true);
    return new Response('Hello world');
}"
            .into(),
        )
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Error(
            "Uncaught TypeError: Parameter 1 is not of type 'Function'\n  at handler (2:5)".into()
        )
    );
    assert!(rx.recv_async().await.is_err());
}

#[tokio::test]
#[serial]
async fn timers_order() {
    let log_rx = setup_logger();
    setup();
    let mut isolate = Isolate::new(
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
        .metadata(Some(("".to_owned(), "".to_owned()))),
    );
    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    assert_eq!(log_rx.recv_async().await.unwrap(), "main".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "microtask".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "promise".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "timeout".to_string());
    assert_eq!(log_rx.recv_async().await.unwrap(), "main 2".to_string());
    assert_eq!(
        rx.recv_async().await.unwrap(),
        RunResult::Response(Response::from("Hello world"))
    );
    assert!(rx.recv_async().await.is_err());
}
