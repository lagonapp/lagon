use super::{pubsub::clear_deployment_cache, Deployments};
use crate::{serverless::Workers, REGION};
use clickhouse::{Client, Row};
use serde::Deserialize;
use std::{collections::HashSet, env, sync::Arc, time::Duration};

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(5);

#[derive(Debug, Row, Deserialize)]
struct MyRow {
    count: usize,
}

pub fn run_cache_clear_task(client: &Client, deployments: Deployments, workers: Workers) {
    let isolates_cache_seconds = Duration::from_secs(
        env::var("LAGON_ISOLATES_CACHE_SECONDS")
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not set")
            .parse()
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not a valid number"),
    );
    let client = Arc::new(client.clone());

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(CACHE_TASK_INTERVAL).await;

            let deployments_id = deployments
                .iter()
                .map(|deployment| deployment.id.clone())
                .collect::<HashSet<_>>();

            for deployment_id in deployments_id {
                let query = client
                    .query("SELECT count(*) as count FROM serverless.requests WHERE timestamp >= subtractSeconds(now(), ?) AND region = ? AND deployment_id = ?")
                    .bind(isolates_cache_seconds.as_secs())
                    .bind(REGION.clone())
                    .bind(deployment_id.clone())
                    .fetch_one::<MyRow>().await;

                if let Ok(row) = query {
                    if row.count == 0 {
                        clear_deployment_cache(
                            deployment_id,
                            Arc::clone(&workers),
                            String::from("expiration"),
                        )
                        .await;
                    }
                }
            }
        }
    });
}
