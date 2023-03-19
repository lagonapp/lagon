use anyhow::Result;
use dashmap::DashMap;
use futures::StreamExt;
use hyper::body::Bytes;
use lagon_runtime_utils::Deployment;
use lagon_serverless::{
    deployments::{downloader::FakeDownloader, pubsub::FakePubSub},
    serverless::start,
};
use serial_test::serial;
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

mod utils;

#[tokio::test]
#[serial]
async fn returns_correct_http() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "request".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            timeout: 1000,
            startup_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        // Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 201);
    assert_eq!(response.headers()["content-type"], "text/plain");
    assert_eq!(response.headers()["content-length"], "4");
    assert_eq!(response.headers()["x-custom"], "custom");
    assert_eq!(response.text().await?, "body");

    Ok(())
}

#[tokio::test]
#[serial]
async fn returns_correct_path() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "path-query".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            timeout: 1000,
            startup_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        // Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "http://127.0.0.1:4000/");

    let response = reqwest::get("http://127.0.0.1:4000/test").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "http://127.0.0.1:4000/test");

    let response = reqwest::get("http://127.0.0.1:4000/test?hello=world").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(
        response.text().await?,
        "http://127.0.0.1:4000/test?hello=world"
    );

    Ok(())
}

#[tokio::test]
#[serial]
async fn forwards_headers() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "forwards-headers".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            timeout: 1000,
            startup_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        // // Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.headers()["x-lagon-region"], "local");
    assert_eq!(response.headers()["x-forwarded-for"], "127.0.0.1");
    assert_eq!(response.text().await?, "");

    Ok(())
}

#[tokio::test]
#[serial]
async fn stream_sequentially() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "stream".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            timeout: 1000,
            startup_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        // // Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);

    let mut stream = response.bytes_stream();
    assert_eq!(stream.next().await.unwrap()?, Bytes::from("Hello"));
    assert_eq!(stream.next().await.unwrap()?, Bytes::from(" "));
    assert_eq!(stream.next().await.unwrap()?, Bytes::from("world"));
    assert!(stream.next().await.is_none());

    Ok(())
}
