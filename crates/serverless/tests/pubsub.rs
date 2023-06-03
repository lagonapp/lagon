use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime_utils::response::{PAGE_403, PAGE_404};
use lagon_serverless::serverless::start;
use lagon_serverless_downloader::FakeDownloader;
use lagon_serverless_pubsub::{FakePubSub, PubSubMessage, PubSubMessageKind};
use serial_test::serial;
use std::{sync::Arc, time::Duration};

mod utils;

#[tokio::test]
#[serial]
async fn deploy_undeploy() -> Result<()> {
    let client = utils::setup();
    let pubsub = FakePubSub::default();
    let tx = pubsub.get_tx();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        pubsub,
        client,
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    tx.send_async(PubSubMessage::new(
        PubSubMessageKind::Deploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "tickTimeout": 1000,
    "totalTimeout": 1000,
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

    tx.send_async(PubSubMessage::new(
        PubSubMessageKind::Undeploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "tickTimeout": 1000,
    "totalTimeout": 1000,
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

#[tokio::test]
#[serial]
async fn assign_correct_domains_prod() -> Result<()> {
    let client = utils::setup();
    let pubsub = FakePubSub::default();
    let tx = pubsub.get_tx();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        pubsub,
        client,
    )
    .await?;
    tokio::spawn(serverless);

    tx.send_async(PubSubMessage::new(
        PubSubMessageKind::Deploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000", "my.domain"],
    "memory": 128,
    "tickTimeout": 1000,
    "totalTimeout": 1000,
    "cron": null,
    "cronRegion": "local",
    "env": {},
    "isProduction": false,
    "assets": []
}"#
        .into(),
    ))
    .await?;
    tokio::time::sleep(Duration::from_millis(100)).await;

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:4000")
        .header("host", "my.domain")
        .send()
        .await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    let response = client
        .get("http://127.0.0.1:4000")
        .header("host", "simple.lagon.dev")
        .send()
        .await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "Hello world");

    Ok(())
}

#[tokio::test]
#[serial]
async fn skip_cron_not_same_region() -> Result<()> {
    let client = utils::setup();
    let pubsub = FakePubSub::default();
    let tx = pubsub.get_tx();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        pubsub,
        client,
    )
    .await?;
    tokio::spawn(serverless);

    tx.send_async(PubSubMessage::new(
        PubSubMessageKind::Deploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "tickTimeout": 1000,
    "totalTimeout": 1000,
    "cron": "* * * * *",
    "cronRegion": "unknown",
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

#[tokio::test]
#[serial]
async fn warn_cron_direct_access() -> Result<()> {
    let client = utils::setup();
    let pubsub = FakePubSub::default();
    let tx = pubsub.get_tx();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        pubsub,
        client,
    )
    .await?;
    tokio::spawn(serverless);

    tx.send_async(PubSubMessage::new(
        PubSubMessageKind::Deploy,
        r#"{
    "functionId": "function_id",
    "functionName": "function_name",
    "deploymentId": "simple",
    "domains": ["127.0.0.1:4000"],
    "memory": 128,
    "tickTimeout": 1000,
    "totalTimeout": 1000,
    "cron": "* * * * *",
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
    assert_eq!(response.status(), 403);
    assert_eq!(response.text().await?, PAGE_403);

    Ok(())
}
