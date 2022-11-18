use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use log::info;
use tokio::sync::RwLock;

use crate::ISOLATES;

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(60);

pub fn run_cache_clear_task(last_requests: Arc<RwLock<HashMap<String, Instant>>>) {
    let isolates_cache_seconds = Duration::from_secs(
        dotenv::var("LAGON_ISOLATES_CACHE_SECONDS")
            .expect("LAGON_ISOLATES_CACHE_SECONDS must be set")
            .parse()
            .expect("Failed to parse LAGON_ISOLATES_CACHE_SECONDS"),
    );

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(CACHE_TASK_INTERVAL).await;

            let now = Instant::now();
            let mut isolates_to_clear = Vec::new();
            let last_requests_reader = last_requests.read().await;

            info!("Running cache clear task");

            for (hostname, last_request) in last_requests_reader.iter() {
                if now.duration_since(*last_request) > isolates_cache_seconds {
                    isolates_to_clear.push(hostname.clone());
                }
            }

            // drop(last_requests);

            if isolates_to_clear.is_empty() {
                continue;
            }

            // Drop the read lock because we now acquire a write lock
            drop(last_requests_reader);

            let mut thread_isolates = ISOLATES.write().await;
            let mut last_requests = last_requests.write().await;

            for hostname in isolates_to_clear {
                for isolates in thread_isolates.values_mut() {
                    last_requests.remove(&hostname);

                    if let Some(isolate) = isolates.remove(&hostname) {
                        let (deployment, ..) = isolate
                            .get_metadata()
                            .unwrap_or_else(|| ("Unknown".to_owned(), "".to_owned()));

                        info!(deployment = deployment; "Clearing deployment from cache due to expiration");
                    }
                }
            }
        }
    });
}
