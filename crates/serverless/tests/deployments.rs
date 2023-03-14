use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime_utils::Deployment;
use lagon_serverless::{
    cronjob::Cronjob,
    deployments::{downloader::FakeDownloader, pubsub::FakePubSub},
    serverless::start,
};
use serial_test::serial;
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};
use tokio::sync::Mutex;

mod utils;

#[tokio::test]
#[serial]
async fn simple() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "simple".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::from(["127.0.0.1:4000".into()]),
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
        FakeDownloader,
        FakePubSub::default(),
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "Hello world");

    Ok(())
}

#[tokio::test]
#[serial]
async fn reuse_isolate() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4001".into(),
        Arc::new(Deployment {
            id: "counter".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::from(["127.0.0.1:4001".into()]),
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
        "127.0.0.1:4001".parse().unwrap(),
        FakeDownloader,
        FakePubSub::default(),
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4001").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "1");

    let response = reqwest::get("http://127.0.0.1:4001").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "2");

    Ok(())
}

#[tokio::test]
#[serial]
async fn reuse_isolate_across_domains() -> Result<()> {
    utils::setup();
    let deployments = Arc::new(DashMap::new());
    let deployment = Arc::new(Deployment {
        id: "counter".into(),
        function_id: "function_id".into(),
        function_name: "function_name".into(),
        domains: HashSet::from(["127.0.0.1:4002".into(), "another.domain".into()]),
        assets: HashSet::new(),
        environment_variables: HashMap::new(),
        memory: 128,
        timeout: 1000,
        startup_timeout: 1000,
        is_production: true,
        cron: None,
    });
    deployments.insert("127.0.0.1:4002".into(), Arc::clone(&deployment));
    deployments.insert("another.domain".into(), deployment);
    let serverless = start(
        deployments,
        "127.0.0.1:4002".parse().unwrap(),
        FakeDownloader,
        FakePubSub::default(),
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4002").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "1");

    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:4002")
        .header("host", "another.domain")
        .send()
        .await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "2");

    Ok(())
}
