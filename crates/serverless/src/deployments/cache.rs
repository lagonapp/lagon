use std::{
    collections::HashMap,
    env,
    sync::Arc,
    time::{Duration, Instant},
};

use tokio::sync::RwLock;
use tokio_util::task::LocalPoolHandle;

use super::pubsub::clear_deployments_cache;

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(1);

pub fn run_cache_clear_task(
    last_requests: Arc<RwLock<HashMap<String, Instant>>>,
    pool: LocalPoolHandle,
) {
    let isolates_cache_seconds = Duration::from_secs(
        env::var("LAGON_ISOLATES_CACHE_SECONDS")
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not set")
            .parse()
            .expect("LAGON_ISOLATES_CACHE_SECONDS is not a valid number"),
    );

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(CACHE_TASK_INTERVAL).await;

            let now = Instant::now();
            let mut hostnames_to_clear = Vec::new();
            let last_requests_reader = last_requests.read().await;

            for (hostname, last_request) in last_requests_reader.iter() {
                if now.duration_since(*last_request) > isolates_cache_seconds {
                    hostnames_to_clear.push(hostname.clone());
                }
            }

            if hostnames_to_clear.is_empty() {
                continue;
            }

            // Drop the read lock because we now acquire a write lock
            drop(last_requests_reader);

            // Clear everything
            let mut last_requests = last_requests.write().await;

            for hostname in &hostnames_to_clear {
                last_requests.remove(hostname);
            }

            clear_deployments_cache(hostnames_to_clear, &pool, "expiration").await;
        }
    });
}
