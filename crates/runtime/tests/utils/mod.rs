use hyper::{http::Request, Body, Response};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{RunResult, StreamResult};
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

type SendRequest = Box<dyn Fn(Request<Body>)>;

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

    let send_isolate_event = Box::new(move |req: Request<Body>| {
        let request_tx = request_tx.clone();
        let sender = sender.clone();

        tokio::spawn(async move {
            let (parts, body) = req.into_parts();
            let body = hyper::body::to_bytes(body).await.unwrap();
            let request = (parts, body);

            request_tx
                .send(IsolateEvent::Request(IsolateRequest { request, sender }))
                .unwrap();
        });
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

    let send_isolate_event = Box::new(move |req: Request<Body>| {
        let request_tx = request_tx.clone();
        let sender = sender.clone();

        tokio::spawn(async move {
            let (parts, body) = req.into_parts();
            let body = hyper::body::to_bytes(body).await.unwrap();
            let request = (parts, body);

            request_tx
                .send(IsolateEvent::Request(IsolateRequest { request, sender }))
                .unwrap();
        });
    });

    (send_isolate_event, receiver)
}

#[allow(dead_code)]
pub async fn assert_run_result(receiver: &flume::Receiver<RunResult>, run_result: RunResult) {
    let result = receiver.recv_async().await.unwrap();

    match run_result {
        RunResult::Response(response, _) => {
            assert_response_inner(response, result.as_response()).await;
        }
        RunResult::Error(error) => {
            assert_eq!(error, result.as_error());
        }
        RunResult::MemoryLimit => {
            assert!(
                result.is_memory_limit(),
                "Expected MemoryLimit, got {:?}",
                result
            );
        }
        RunResult::Timeout => {
            assert!(result.is_timeout(), "Expected Timeout, got {:?}", result);
        }
        RunResult::Stream(stream_result) => match stream_result {
            StreamResult::Done(_) => {
                assert!(
                    matches!(result, RunResult::Stream(StreamResult::Done(_))),
                    "Expected StreamResult::Done, got {:?}",
                    result
                );
            }
            StreamResult::Data(data) => {
                assert!(
                    matches!(result, RunResult::Stream(StreamResult::Data(_))),
                    "Expected StreamResult::Data, got {:?}",
                    result
                );

                let result_data = match result {
                    RunResult::Stream(StreamResult::Data(data)) => data,
                    _ => unreachable!(),
                };

                assert_eq!(data, result_data);
            }
            StreamResult::Start(response) => {
                assert!(
                    matches!(result, RunResult::Stream(StreamResult::Start(_))),
                    "Expected StreamResult::Start, got {:?}",
                    result,
                );

                let result_response = match result {
                    RunResult::Stream(StreamResult::Start(response)) => response,
                    _ => unreachable!(),
                };

                let response = response.body(Body::empty()).unwrap();
                let result_response = result_response.body(Body::empty()).unwrap();

                assert_response_inner(response, result_response).await;
            }
        },
    }
}

async fn assert_response_inner(first: Response<Body>, second: Response<Body>) {
    assert_eq!(first.status(), second.status(), "Status mismatch");
    assert_eq!(first.headers(), second.headers(), "Headers mismatch");

    let body1 = hyper::body::to_bytes(first.into_body()).await.unwrap();
    let body2 = hyper::body::to_bytes(second.into_body()).await.unwrap();

    assert_eq!(body1, body2, "Body mismatch");
}

#[allow(dead_code)]
pub async fn assert_response(receiver: &flume::Receiver<RunResult>, response: Response<Body>) {
    let result = receiver.recv_async().await.unwrap().as_response();

    assert_response_inner(result, response).await;
}
