use std::{
    collections::HashMap,
    env,
    sync::Arc,
    time::{Duration, Instant},
};

use log::{error, info};
use tokio::sync::RwLock;
use tokio_util::task::LocalPoolHandle;

use crate::ISOLATES;

const CACHE_TASK_INTERVAL: Duration = Duration::from_secs(60);

pub fn run_cache_clear_task(
    last_requests: Arc<RwLock<HashMap<String, Instant>>>,
    thread_ids: Arc<RwLock<HashMap<String, usize>>>,
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
            let mut isolates_to_clear = Vec::new();
            let last_requests_reader = last_requests.read().await;

            for (hostname, last_request) in last_requests_reader.iter() {
                if now.duration_since(*last_request) > isolates_cache_seconds {
                    isolates_to_clear.push(hostname.clone());
                }
            }

            if isolates_to_clear.is_empty() {
                continue;
            }

            // Drop the read lock because we now acquire a write lock
            drop(last_requests_reader);

            let mut last_requests = last_requests.write().await;
            let thread_ids = thread_ids.read().await;

            for hostname in isolates_to_clear {
                if let Some(thread_id) = thread_ids.get(&hostname) {
                    last_requests.remove(&hostname);

                    let thread_id = *thread_id;

                    // The isolate is implicitely dropped when the block after `remove()` ends
                    //
                    // An isolate must be dropped (which will call `exit()` and terminate the
                    // execution) in the same thread as it was created in
                    match pool.spawn_pinned_by_idx(move || async move {
                        let mut thread_isolates = ISOLATES.write().await;
                        let thread_isolates = thread_isolates.get_mut(&thread_id).unwrap();

                        if let Some(isolate) = thread_isolates.remove(&hostname) {
                            let metadata = isolate.get_metadata();

                            if let Some((deployment, ..)) = metadata.as_ref() {
                                info!(deployment = deployment; "Clearing deployment from cache due to expiration");
                            }
                        }
                    }, thread_id)
                        .await {
                            Ok(_) => {},
                            Err(err) => {
                                error!("Failed to clear deployment from cache: {}", err);
                            }
                        };
                }
            }
        }
    });
}
