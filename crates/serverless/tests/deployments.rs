use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime_utils::Deployment;
use lagon_serverless::serverless::start;
use lagon_serverless_downloader::FakeDownloader;
use lagon_serverless_pubsub::FakePubSub;
use serial_test::serial;
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

mod utils;

#[tokio::test]
#[serial]
async fn simple() -> Result<()> {
    let client = utils::setup();
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
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        client,
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
async fn custom_domains() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    let deployment = Arc::new(Deployment {
        id: "simple".into(),
        function_id: "function_id".into(),
        function_name: "function_name".into(),
        domains: HashSet::from(["127.0.0.1:4000".into(), "custom.domain".into()]),
        assets: HashSet::new(),
        environment_variables: HashMap::new(),
        memory: 128,
        tick_timeout: 1000,
        total_timeout: 1000,
        is_production: true,
        cron: None,
    });
    deployments.insert("127.0.0.1:4000".into(), Arc::clone(&deployment));
    deployments.insert("custom.domain".into(), Arc::clone(&deployment));
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        client,
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "Hello world");

    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:4000")
        .header("host", "custom.domain")
        .send()
        .await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "Hello world");

    Ok(())
}

#[tokio::test]
#[serial]
async fn reuse_isolate() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "counter".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::from(["127.0.0.1:4000".into()]),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: true,
            cron: None,
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        client,
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "1");

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "2");

    Ok(())
}

#[tokio::test]
#[serial]
async fn reuse_isolate_across_domains() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    let deployment = Arc::new(Deployment {
        id: "counter".into(),
        function_id: "function_id".into(),
        function_name: "function_name".into(),
        domains: HashSet::from(["127.0.0.1:4000".into(), "another.domain".into()]),
        assets: HashSet::new(),
        environment_variables: HashMap::new(),
        memory: 128,
        tick_timeout: 1000,
        total_timeout: 1000,
        is_production: true,
        cron: None,
    });
    deployments.insert("127.0.0.1:4000".into(), Arc::clone(&deployment));
    deployments.insert("another.domain".into(), deployment);
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        client,
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "1");

    let client = reqwest::Client::new();
    let response = client
        .get("http://127.0.0.1:4000")
        .header("host", "another.domain")
        .send()
        .await?;
    assert_eq!(response.status(), 200);
    assert_eq!(response.text().await?, "2");

    Ok(())
}
