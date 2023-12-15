use super::pubsub::clear_deployment_cache;
use crate::serverless::Workers;
use dashmap::DashMap;
use std::{
    env,
    sync::Arc,
    time::{Duration, Instant},
};

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(5);

pub fn run_cache_clear_task(last_requests: Arc<DashMap<String, Instant>>, workers: Workers) {
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

            let now = Instant::now();

            for last_request in last_requests.iter() {
                let (deployment_id, last_request) = last_request.pair();

                if now.duration_since(*last_request) > isolates_cache_seconds {
                    deployments_to_clear.push(deployment_id.clone());
                }
            }

            if deployments_to_clear.is_empty() {
                continue;
            }

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
