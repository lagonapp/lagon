use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime_utils::response::PAGE_404;
use lagon_serverless::{
    cronjob::Cronjob,
    deployments::{
        downloader::FakeDownloader,
        pubsub::{FakePubSub, PubSubMessage},
    },
    serverless::start,
};
use serial_test::serial;
use std::{sync::Arc, time::Duration};
use tokio::sync::Mutex;

mod utils;

#[tokio::test]
#[serial]
async fn deploy_undeploy() -> Result<()> {
    utils::setup();
    let pubsub = FakePubSub::default();
    let tx = pubsub.get_tx();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        FakeDownloader,
        pubsub,
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    tx.send_async((
        PubSubMessage::Deploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "timeout": 1000,
    "startupTimeout": 1000,
    "cron": null,
    "cronRegion": "local",
    "env": {},
    "isProduction": true,
    "assets": []
}"#
        .into(),
    ))
    .await?;
    tokio::time::sleep(Duration::from_millis(100)).await;

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "Hello world");

    tx.send_async((
        PubSubMessage::Undeploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "timeout": 1000,
    "startupTimeout": 1000,
    "cron": null,
    "cronRegion": "local",
    "env": {},
    "isProduction": true,
    "assets": []
}"#
        .into(),
    ))
    .await?;
    tokio::time::sleep(Duration::from_millis(100)).await;

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    Ok(())
}
