use lagon_runtime_http::{Request, Response};
use lagon_runtime_isolate::options::IsolateOptions;
use serial_test::serial;

mod utils;

#[tokio::test]
async fn set_timeout() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("test")
    );
}

#[tokio::test]
#[serial]
async fn set_timeout_not_blocking_response() {
    let (logs_sender, logs_receiver) = flume::unbounded();
    utils::setup();
    let (send, receiver) = utils::create_isolate(
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
        .log_sender(logs_sender),
    );
    send(Request::default());

    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "before".into(), None)
    );
    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello!")
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "after".into(), None)
    );
}

#[tokio::test]
async fn set_timeout_clear() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("second")
    );
}

#[tokio::test]
async fn set_timeout_clear_correct() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(
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
    send(Request::default());

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("first")
    );
}

#[tokio::test]
#[serial]
async fn set_interval() {
    let (logs_sender, logs_receiver) = flume::unbounded();
    utils::setup();
    let (send, receiver) = utils::create_isolate(
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
        .log_sender(logs_sender),
    );
    send(Request::default());

    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "interval 1".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "interval 2".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "interval 3".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "res".into(), None)
    );

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
}

#[tokio::test]
#[serial]
async fn queue_microtask() {
    let (logs_sender, logs_receiver) = flume::unbounded();
    utils::setup();
    let (send, receiver) = utils::create_isolate(
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
        .log_sender(logs_sender),
    );
    send(Request::default());

    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "before".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "microtask".into(), None)
    );

    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
}

#[tokio::test]
#[serial]
async fn timers_order() {
    let (logs_sender, logs_receiver) = flume::unbounded();
    utils::setup();
    let (send, receiver) = utils::create_isolate(
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
        .log_sender(logs_sender),
    );
    send(Request::default());

    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "main".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "microtask".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "promise".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "timeout".into(), None)
    );
    assert_eq!(
        logs_receiver.recv_async().await.unwrap(),
        ("log".into(), "main 2".into(), None)
    );
    assert_eq!(
        receiver.recv_async().await.unwrap().as_response(),
        Response::from("Hello world")
    );
}
