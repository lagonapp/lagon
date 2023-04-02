use std::env;

use anyhow::Result;
use clickhouse::{Client, Row};
use serde::Serialize;

#[derive(Row, Serialize)]
pub struct LogRow {
    pub function_id: String,
    pub deployment_id: String,
    pub level: String,
    pub message: String,
    pub region: String,
    pub timestamp: u32,
}

#[derive(Row, Serialize)]
pub struct RequestRow {
    pub function_id: String,
    pub deployment_id: String,
    pub region: String,
    pub isolate: bool,
    pub bytes_in: u32,
    pub bytes_out: u32,
    pub timestamp: u32,
}

pub fn create_client() -> Client {
    let url = env::var("CLICKHOUSE_URL").expect("CLICKHOUSE_URL must be set");
    let user = env::var("CLICKHOUSE_USER").expect("CLICKHOUSE_USER must be set");

    let client = Client::default()
        .with_url(url)
        .with_user(user)
        .with_database("default");

    if let Ok(password) = env::var("CLICKHOUSE_PASSWORD") {
        return client.with_password(password);
    }

    client
}

pub async fn run_migrations(client: &Client) -> Result<()> {
    client
        .query("CREATE DATABASE IF NOT EXISTS serverless")
        .execute()
        .await?;

    client
        .query(
            "CREATE TABLE IF NOT EXISTS serverless.logs
(
    function_id String,
    deployment_id String,
    level String,
    message String,
    region String,
    timestamp DateTime,
)
ENGINE = MergeTree()
PRIMARY KEY (level, timestamp)
ORDER BY timestamp",
        )
        .execute()
        .await?;

    client
        .query(
            "CREATE TABLE IF NOT EXISTS serverless.requests
(
    function_id String,
    deployment_id String,
    region String,
    isolate Bool,
    bytes_in UInt32,
    bytes_out UInt32,
    timestamp DateTime,
)
ENGINE = MergeTree()
PRIMARY KEY (timestamp)
ORDER BY timestamp",
        )
        .execute()
        .await?;

    Ok(())
}
