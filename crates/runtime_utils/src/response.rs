use anyhow::Result;
use flume::Receiver;
use hyper::{body::Bytes, http::response::Builder, Body, Response as HyperResponse};
use lagon_runtime_http::{RunResult, StreamResult};

pub const PAGE_404: &str = include_str!("../public/404.html");
pub const PAGE_403: &str = include_str!("../public/403.html");
pub const PAGE_502: &str = include_str!("../public/502.html");
pub const PAGE_500: &str = include_str!("../public/500.html");

pub const FAVICON_URL: &str = "/favicon.ico";

pub enum ResponseEvent {
    Bytes(usize),
    StreamDoneNoDataError,
    StreamDoneDataError,
    UnexpectedStreamResult(RunResult),
    LimitsReached(RunResult),
    Error(RunResult),
}

type OnEvent<D> = Box<dyn Fn(ResponseEvent, D) + Send>;

pub async fn handle_response<D>(
    rx: Receiver<RunResult>,
    data: D,
    on_event: OnEvent<D>,
) -> Result<HyperResponse<Body>>
where
    D: Send + Clone + 'static,
{
    let result = rx.recv_async().await.unwrap_or(RunResult::Timeout);

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
                    on_event(ResponseEvent::Bytes(bytes.len()), data.clone());

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
                            on_event(ResponseEvent::Bytes(bytes.len()), data.clone());

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
            on_event(ResponseEvent::Bytes(response.len()), data);

            Ok(Builder::try_from(&response)?.body(response.body.into())?)
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

#[cfg(test)]
mod tests {
    use hyper::body::to_bytes;
    use lagon_runtime_http::Response;

    use super::*;

    #[tokio::test]
    async fn sequential() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let mut response = handle_response(rx, (), Box::new(|_, _| ())).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello World")
            );
        });

        tx.send_async(RunResult::Response(Response::from("Hello World")))
            .await
            .unwrap();

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn stream() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let mut response = handle_response(rx, (), Box::new(|_, _| ())).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello world")
            );
        });

        tx.send_async(RunResult::Stream(StreamResult::Start(Response::from(""))))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Data(b"Hello".to_vec())))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Data(b" world".to_vec())))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Done))
            .await
            .unwrap();

        drop(tx);

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn stream_data_before_response() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let mut response = handle_response(rx, (), Box::new(|_, _| ())).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello world")
            );
        });

        tx.send_async(RunResult::Stream(StreamResult::Data(b"Hello".to_vec())))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Start(Response::from(""))))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Data(b" world".to_vec())))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Done))
            .await
            .unwrap();

        drop(tx);

        handle.await.unwrap();
    }
}
