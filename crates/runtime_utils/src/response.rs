use anyhow::Result;
use flume::Receiver;
use http_body_util::{combinators::BoxBody, Full, StreamBody};
use hyper::{
    body::{Bytes, Frame},
    http::response::Builder,
    Response as HyperResponse,
};
use lagon_runtime_http::{RunResult, StreamResult};
use std::{convert::Infallible, future::Future};

pub const PAGE_404: &str = include_str!("../public/404.html");
pub const PAGE_403: &str = include_str!("../public/403.html");
pub const PAGE_502: &str = include_str!("../public/502.html");
pub const PAGE_500: &str = include_str!("../public/500.html");

pub const FAVICON_URL: &str = "/favicon.ico";

pub enum ResponseEvent {
    Bytes(usize, Option<u128>),
    StreamDoneNoDataError,
    UnexpectedStreamResult(RunResult),
    LimitsReached(RunResult),
    Error(RunResult),
}

pub async fn handle_response<F>(
    rx: Receiver<RunResult>,
    on_event: impl Fn(ResponseEvent) -> F + Send + Sync + 'static,
) -> Result<HyperResponse<BoxBody<Bytes, Infallible>>>
where
    F: Future<Output = Result<()>> + Send,
{
    let result = rx.recv_async().await?;

    match result {
        RunResult::Stream(stream_result) => {
            let (stream_tx, stream_rx) = flume::unbounded::<Result<Frame<Bytes>, Infallible>>();
            let body = StreamBody::new(stream_rx.into_stream());

            let (response_tx, response_rx) = flume::bounded(1);
            let mut total_bytes = 0;

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap_or(());
                }
                StreamResult::Data(bytes) => {
                    total_bytes += bytes.len();

                    stream_tx
                        .send_async(Ok(Frame::data(Bytes::from(bytes))))
                        .await
                        .unwrap_or(());
                }
                StreamResult::Done(_) => {
                    on_event(ResponseEvent::StreamDoneNoDataError).await?;

                    // Close the stream by sending empty bytes
                    stream_tx
                        .send_async(Ok(Frame::data(Bytes::new())))
                        .await
                        .unwrap_or(());
                }
            }

            tokio::spawn(async move {
                while let Ok(result) = rx.recv_async().await {
                    match result {
                        RunResult::Stream(StreamResult::Start(response)) => {
                            response_tx.send_async(response).await.unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Data(bytes)) => {
                            total_bytes += bytes.len();

                            stream_tx
                                .send_async(Ok(Frame::data(Bytes::from(bytes))))
                                .await
                                .unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Done(elapsed)) => {
                            on_event(ResponseEvent::Bytes(total_bytes, Some(elapsed.as_micros())))
                                .await
                                .unwrap_or(());

                            // Close the stream by sending empty bytes
                            stream_tx
                                .send_async(Ok(Frame::data(Bytes::new())))
                                .await
                                .unwrap_or(());
                        }
                        _ => {
                            on_event(ResponseEvent::UnexpectedStreamResult(result))
                                .await
                                .unwrap_or(());

                            // Close the stream by sending empty bytes
                            stream_tx
                                .send_async(Ok(Frame::data(Bytes::new())))
                                .await
                                .unwrap_or(());
                            break;
                        }
                    }
                }
            });

            let response = response_rx.recv_async().await?;
            let hyper_response = Builder::try_from(&response)?.body(BoxBody::new(body))?;

            Ok(hyper_response)
        }
        RunResult::Response(response, elapsed) => {
            let event =
                ResponseEvent::Bytes(response.len(), elapsed.map(|duration| duration.as_micros()));
            on_event(event).await?;

            Ok(Builder::try_from(&response)?.body(BoxBody::new(Full::new(response.body)))?)
        }
        RunResult::Timeout | RunResult::MemoryLimit => {
            let event = ResponseEvent::LimitsReached(result);
            on_event(event).await?;

            Ok(HyperResponse::builder()
                .status(502)
                .body(BoxBody::new(Full::new(PAGE_502.into())))?)
        }
        RunResult::Error(_) => {
            let event = ResponseEvent::Error(result);
            on_event(event).await?;

            Ok(HyperResponse::builder()
                .status(500)
                .body(BoxBody::new(Full::new(PAGE_500.into())))?)
        }
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use http_body_util::BodyExt;
    use lagon_runtime_http::Response;

    use super::*;

    #[tokio::test]
    async fn sequential() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let response = handle_response(rx, |_| async { Ok(()) }).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                response.collect().await.unwrap().to_bytes(),
                Bytes::from("Hello World")
            );
        });

        tx.send_async(RunResult::Response(Response::from("Hello World"), None))
            .await
            .unwrap();

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn stream() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let response = handle_response(rx, |_| async { Ok(()) }).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                response.collect().await.unwrap().to_bytes(),
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

        tx.send_async(RunResult::Stream(StreamResult::Done(Duration::from_secs(
            0,
        ))))
        .await
        .unwrap();

        drop(tx);

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn stream_data_before_response() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let response = handle_response(rx, |_| async { Ok(()) }).await.unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                response.collect().await.unwrap().to_bytes(),
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

        tx.send_async(RunResult::Stream(StreamResult::Done(Duration::from_secs(
            0,
        ))))
        .await
        .unwrap();

        drop(tx);

        handle.await.unwrap();
    }
}
