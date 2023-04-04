use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate, IsolateEvent, IsolateRequest};
use std::sync::Once;
use tokio::runtime::Handle;

#[allow(dead_code)]
pub fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[allow(dead_code)]
pub fn setup_allow_codegen() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default().allow_code_generation(true));
    });
}

type SendRequest = Box<dyn Fn(Request)>;

#[allow(dead_code)]
pub fn create_isolate(options: IsolateOptions) -> (SendRequest, flume::Receiver<RunResult>) {
    let (request_tx, request_rx) = flume::unbounded();
    let (sender, receiver) = flume::unbounded();

    let handle = Handle::current();
    std::thread::spawn(move || {
        handle.block_on(async move {
            let mut isolate = Isolate::new(
                options.snapshot_blob(include_bytes!("../../../serverless/snapshot.bin")),
                request_rx,
            );
            isolate.evaluate();
            isolate.run_event_loop().await;
        })
    });

    let send_isolate_event = Box::new(move |request: Request| {
        request_tx
            .send(IsolateEvent::Request(IsolateRequest {
                request,
                sender: sender.clone(),
            }))
            .unwrap();
    });

    (send_isolate_event, receiver)
}

#[allow(dead_code)]
pub fn create_isolate_without_snapshot(
    options: IsolateOptions,
) -> (SendRequest, flume::Receiver<RunResult>) {
    let (request_tx, request_rx) = flume::unbounded();
    let (sender, receiver) = flume::unbounded();

    let handle = Handle::current();
    std::thread::spawn(move || {
        handle.block_on(async move {
            let mut isolate = Isolate::new(options, request_rx);
            isolate.evaluate();
            isolate.run_event_loop().await;
        })
    });

    let send_isolate_event = Box::new(move |request: Request| {
        request_tx
            .send(IsolateEvent::Request(IsolateRequest {
                request,
                sender: sender.clone(),
            }))
            .unwrap();
    });

    (send_isolate_event, receiver)
}
