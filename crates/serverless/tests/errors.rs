use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime_utils::{
    response::{PAGE_403, PAGE_404, PAGE_500, PAGE_502},
    Deployment,
};
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
async fn return_404_no_deployment_found() -> Result<()> {
    let client = utils::setup();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        Arc::new(FakeDownloader),
        FakePubSub::default(),
        client,
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_403_cron_deployment() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "id".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: true,
            cron: Some("".into()),
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
    assert_eq!(response.status(), 403);
    assert_eq!(response.text().await?, PAGE_403);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_500_unknown_code() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "unknown".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
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
    assert_eq!(response.status(), 500);
    assert_eq!(response.text().await?, PAGE_500);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_502_timeout_execution() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "timeout-execution".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
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
    assert_eq!(response.status(), 502);
    assert_eq!(response.text().await?, PAGE_502);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_502_timeout_init() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "timeout-init".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
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
    assert_eq!(response.status(), 502);
    assert_eq!(response.text().await?, PAGE_502);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_500_code_invalid() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "code-invalid".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
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
    assert_eq!(response.status(), 500);
    assert_eq!(response.text().await?, PAGE_500);

    Ok(())
}

#[tokio::test]
#[serial]
async fn return_500_throw_error() -> Result<()> {
    let client = utils::setup();
    let deployments = Arc::new(DashMap::new());
    deployments.insert(
        "127.0.0.1:4000".into(),
        Arc::new(Deployment {
            id: "throw-error".into(),
            function_id: "function_id".into(),
            function_name: "function_name".into(),
            domains: HashSet::new(),
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
    assert_eq!(response.status(), 500);
    assert_eq!(response.text().await?, PAGE_500);

    Ok(())
}
