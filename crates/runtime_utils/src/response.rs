use anyhow::Result;
use flume::Receiver;
use hyper::{body::Bytes, http::response::Builder, Body, Response as HyperResponse};
use lagon_runtime_http::{RunResult, StreamResult};

const PAGE_404: &str = include_str!("../public/404.html");
const PAGE_502: &str = include_str!("../public/502.html");
const PAGE_500: &str = include_str!("../public/500.html");

pub enum ResponseEvent {
    StreamData(usize),
    StreamDoneNoDataError,
    StreamDoneDataError,
    UnexpectedStreamResult(RunResult),
    LimitsReached(RunResult),
    Error(RunResult),
}

pub async fn handle_response<T: Send + Clone + 'static>(
    rx: Receiver<RunResult>,
    data: T,
    on_event: Box<dyn Fn(ResponseEvent, T) + Send>,
) -> Result<HyperResponse<Body>> {
    let result = rx.recv_async().await?;

    match result {
        RunResult::Stream(stream_result) => {
            let (stream_tx, stream_rx) = flume::unbounded::<Result<Bytes, std::io::Error>>();
            let body = Body::wrap_stream(stream_rx.into_stream());

            let (response_tx, response_rx) = flume::bounded(1);

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap_or(());
                }
                StreamResult::Data(bytes) => {
                    on_event(ResponseEvent::StreamData(bytes.len()), data.clone());

                    let bytes = Bytes::from(bytes);
                    stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                }
                StreamResult::Done => {
                    on_event(ResponseEvent::StreamDoneNoDataError, data.clone());

                    // Close the stream by sending empty bytes
                    stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                }
            }

            tokio::spawn(async move {
                let mut done = false;

                while let Ok(result) = rx.recv_async().await {
                    match result {
                        RunResult::Stream(StreamResult::Start(response)) => {
                            response_tx.send_async(response).await.unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Data(bytes)) => {
                            if done {
                                on_event(ResponseEvent::StreamDoneDataError, data.clone());

                                // Close the stream by sending empty bytes
                                stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                                break;
                            }

                            let bytes = Bytes::from(bytes);
                            stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                        }
                        _ => {
                            done = result == RunResult::Stream(StreamResult::Done);

                            if !done {
                                on_event(
                                    ResponseEvent::UnexpectedStreamResult(result),
                                    data.clone(),
                                );
                            }

                            // Close the stream by sending empty bytes
                            stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                        }
                    }
                }
            });

            let response = response_rx.recv_async().await?;
            let hyper_response = Builder::try_from(&response)?.body(body)?;

            Ok(hyper_response)
        }
        RunResult::Response(response) => {
            let hyper_response = Builder::try_from(&response)?.body(response.body.into())?;

            Ok(hyper_response)
        }
        RunResult::Timeout | RunResult::MemoryLimit => {
            on_event(ResponseEvent::LimitsReached(result), data);

            Ok(HyperResponse::builder().status(502).body(PAGE_502.into())?)
        }
        RunResult::Error(_) => {
            on_event(ResponseEvent::Error(result), data);

            Ok(HyperResponse::builder().status(500).body(PAGE_500.into())?)
        }
        RunResult::NotFound => Ok(HyperResponse::builder().status(404).body(PAGE_404.into())?),
    }
}
