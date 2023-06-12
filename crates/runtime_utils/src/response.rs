use crate::Deployment;
use anyhow::Result;
use flume::Receiver;
use hyper::{
    body::{Bytes, HttpBody},
    Body, Response,
};
use lagon_runtime_http::{RunResult, StreamResult};
use std::{future::Future, sync::Arc};

pub const PAGE_404: &str = include_str!("../public/404.html");
pub const PAGE_403: &str = include_str!("../public/403.html");
pub const PAGE_502: &str = include_str!("../public/502.html");
pub const PAGE_500: &str = include_str!("../public/500.html");
pub const FAVICON_URL: &str = "/favicon.ico";

#[derive(Debug)]
pub enum ResponseEvent {
    Bytes(usize, Option<u128>),
    StreamDoneNoDataError,
    UnexpectedStreamResult(RunResult),
    LimitsReached(RunResult),
    Error(RunResult),
}

const X_ROBOTS_TAGS: &str = "x-robots-tag";

fn enrich_response(response: &mut Response<Body>, deployment: &Deployment) {
    // We automatically add a X-Robots-Tag: noindex header to
    // all preview deployments to prevent them from being
    // indexed by search engines
    if !deployment.is_production {
        response
            .headers_mut()
            .insert(X_ROBOTS_TAGS, "noindex".parse().unwrap());
    }
}

pub async fn handle_response<F>(
    rx: Receiver<RunResult>,
    deployment: Arc<Deployment>,
    on_event: impl Fn(ResponseEvent) -> F + Send + Sync + 'static,
) -> Result<Response<Body>>
where
    F: Future<Output = Result<()>> + Send,
{
    let result = rx.recv_async().await?;

    match result {
        RunResult::Stream(stream_result) => {
            let (stream_tx, stream_rx) = flume::unbounded::<Result<Bytes, std::io::Error>>();
            let body = Body::wrap_stream(stream_rx.into_stream());

            let (response_builder_tx, response_builder_rx) = flume::bounded(1);
            let mut total_bytes = 0;

            match stream_result {
                StreamResult::Start(response) => {
                    response_builder_tx.send_async(response).await.unwrap_or(());
                }
                StreamResult::Data(bytes) => {
                    total_bytes += bytes.len();

                    let bytes = Bytes::from(bytes);
                    stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                }
                StreamResult::Done(_) => {
                    on_event(ResponseEvent::StreamDoneNoDataError).await?;

                    // Close the stream by sending empty bytes
                    stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                }
            }

            tokio::spawn(async move {
                while let Ok(result) = rx.recv_async().await {
                    match result {
                        RunResult::Stream(StreamResult::Start(response)) => {
                            response_builder_tx.send_async(response).await.unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Data(bytes)) => {
                            total_bytes += bytes.len();

                            let bytes = Bytes::from(bytes);
                            stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Done(elapsed)) => {
                            on_event(ResponseEvent::Bytes(total_bytes, Some(elapsed.as_micros())))
                                .await
                                .unwrap_or(());

                            // Close the stream by sending empty bytes
                            stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                        }
                        _ => {
                            on_event(ResponseEvent::UnexpectedStreamResult(result))
                                .await
                                .unwrap_or(());

                            // Close the stream by sending empty bytes
                            stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                            break;
                        }
                    }
                }
            });

            let response_builder = response_builder_rx.recv_async().await?;
            let mut response = response_builder.body(body)?;

            enrich_response(&mut response, &deployment);

            Ok(response)
        }
        RunResult::Response(mut response, elapsed) => {
            enrich_response(&mut response, &deployment);

            let bytes = response.body().size_hint().exact().unwrap_or(0);
            let event =
                ResponseEvent::Bytes(bytes as usize, elapsed.map(|duration| duration.as_micros()));
            on_event(event).await?;

            Ok(response)
        }
        RunResult::Timeout | RunResult::MemoryLimit => {
            let event = ResponseEvent::LimitsReached(result);
            on_event(event).await?;

            Ok(Response::builder().status(502).body(PAGE_502.into())?)
        }
        RunResult::Error(_) => {
            let event = ResponseEvent::Error(result);
            on_event(event).await?;

            Ok(Response::builder().status(500).body(PAGE_500.into())?)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hyper::{body::to_bytes, Response};
    use std::time::Duration;

    #[tokio::test]
    async fn sequential() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let deployment = Arc::new(Deployment::default());
            let mut response = handle_response(rx, deployment, |event| async move {
                assert!(matches!(event, ResponseEvent::Bytes(11, None)));

                Ok(())
            })
            .await
            .unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello World")
            );
            assert!(response.headers().get(X_ROBOTS_TAGS).is_some());
        });

        tx.send_async(RunResult::Response(
            Response::new("Hello World".into()),
            None,
        ))
        .await
        .unwrap();

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn sequential_production() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let deployment = Arc::new(Deployment {
                is_production: true,
                ..Deployment::default()
            });

            let mut response = handle_response(rx, deployment, |event| async move {
                assert!(matches!(event, ResponseEvent::Bytes(11, None)));

                Ok(())
            })
            .await
            .unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello World")
            );
            assert!(response.headers().get(X_ROBOTS_TAGS).is_none());
        });

        tx.send_async(RunResult::Response(
            Response::new("Hello World".into()),
            None,
        ))
        .await
        .unwrap();

        handle.await.unwrap();
    }

    #[tokio::test]
    async fn stream() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let deployment = Arc::new(Deployment::default());
            let mut response = handle_response(rx, deployment, |event| async move {
                assert!(matches!(event, ResponseEvent::Bytes(11, Some(0))));

                Ok(())
            })
            .await
            .unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello world")
            );
            assert!(response.headers().get(X_ROBOTS_TAGS).is_some());
        });

        tx.send_async(RunResult::Stream(StreamResult::Start(Response::builder())))
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
    async fn stream_production() {
        let (tx, rx) = flume::unbounded::<RunResult>();

        let handle = tokio::spawn(async move {
            let deployment = Arc::new(Deployment {
                is_production: true,
                ..Deployment::default()
            });

            let mut response = handle_response(rx, deployment, |event| async move {
                assert!(matches!(event, ResponseEvent::Bytes(11, Some(0))));

                Ok(())
            })
            .await
            .unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello world")
            );
            assert!(response.headers().get(X_ROBOTS_TAGS).is_none());
        });

        tx.send_async(RunResult::Stream(StreamResult::Start(Response::builder())))
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
            let deployment = Arc::new(Deployment::default());
            let mut response = handle_response(rx, deployment, |event| async move {
                assert!(matches!(event, ResponseEvent::Bytes(11, Some(0))));

                Ok(())
            })
            .await
            .unwrap();

            assert_eq!(response.status(), 200);
            assert_eq!(
                to_bytes(response.body_mut()).await.unwrap(),
                Bytes::from("Hello world")
            );
            assert!(response.headers().get(X_ROBOTS_TAGS).is_some());
        });

        tx.send_async(RunResult::Stream(StreamResult::Data(b"Hello".to_vec())))
            .await
            .unwrap();

        tx.send_async(RunResult::Stream(StreamResult::Start(Response::builder())))
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
