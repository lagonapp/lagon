use std::{
    collections::HashMap,
    env,
    sync::Arc,
    time::{Duration, Instant},
};

use tokio::sync::RwLock;

use crate::worker::Workers;

use super::pubsub::clear_deployment_cache;

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(1);

pub fn run_cache_clear_task(
    last_requests: Arc<RwLock<HashMap<String, Instant>>>,
    workers: Workers,
) {
    let isolates_cache_seconds = Duration::from_secs(
        env::var("LAGON_ISOLATES_CACHE_SECONDS")
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not set")
            .parse()
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not a valid number"),
    );

    tokio::spawn(async move {
        let mut deployments_to_clear = Vec::new();

        loop {
            tokio::time::sleep(CACHE_TASK_INTERVAL).await;

            let last_requests_reader = last_requests.read().await;
            let now = Instant::now();

            for (deployment_id, last_request) in last_requests_reader.iter() {
                if now.duration_since(*last_request) > isolates_cache_seconds {
                    deployments_to_clear.push(deployment_id.clone());
                }
            }

            if deployments_to_clear.is_empty() {
                continue;
            }

            // Drop the read lock because we now acquire a write lock
            drop(last_requests_reader);

            // Clear everything
            let mut last_requests = last_requests.write().await;

            for deployment_id in &deployments_to_clear {
                last_requests.remove(deployment_id);

                clear_deployment_cache(
                    deployment_id.clone(),
                    Arc::clone(&workers),
                    String::from("expiration"),
                )
                .await;
            }

            deployments_to_clear.clear();
        }
    });
}
