use std::{env, sync::OnceLock};

// TODO add back cron jobs
// pub mod cronjob;
pub mod clickhouse;
pub mod deployments;
pub mod serverless;

static REGION: OnceLock<String> = OnceLock::new();

pub fn get_region() -> &'static String {
    REGION.get_or_init(|| env::var("LAGON_REGION").expect("LAGON_REGION must be set"))
}

pub const SNAPSHOT_BLOB: &[u8] = include_bytes!("../snapshot.bin");
