use anyhow::Result;
use dashmap::DashMap;
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_utils::{
    response::{PAGE_404, PAGE_500},
    Deployment,
};
use lagon_serverless::{
    cronjob::Cronjob, deployments::downloader::FakeDownloader, serverless::start,
};
use serial_test::serial;
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Once},
};
use tokio::sync::Mutex;

fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        dotenv::dotenv().expect("Failed to load .env file");

        Runtime::new(RuntimeOptions::default());
    });
}

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn return_404_no_deployment_found() -> Result<()> {
    setup();
    let serverless = start(
        Arc::new(DashMap::new()),
        "127.0.0.1:4000".parse().unwrap(),
        FakeDownloader,
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    Ok(())
}

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn return_404_cron_deployment() -> Result<()> {
    setup();
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
            timeout: 1000,
            startup_timeout: 1000,
            is_production: true,
            cron: Some("".into()),
        }),
    );
    let serverless = start(
        deployments,
        "127.0.0.1:4000".parse().unwrap(),
        FakeDownloader,
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 404);
    assert_eq!(response.text().await?, PAGE_404);

    Ok(())
}

#[tokio::test(flavor = "multi_thread")]
#[serial]
async fn return_500_unknown_code() -> Result<()> {
    setup();
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
        Arc::new(Mutex::new(Cronjob::new().await)),
    )
    .await?;
    tokio::spawn(serverless);

    let response = reqwest::get("http://127.0.0.1:4000").await?;
    assert_eq!(response.status(), 500);
    assert_eq!(response.text().await?, PAGE_500);

    Ok(())
}
