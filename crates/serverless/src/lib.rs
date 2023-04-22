use once_cell::sync::Lazy;
use std::env;

// TODO add back cron jobs
// pub mod cronjob;
pub mod clickhouse;
pub mod deployments;
pub mod serverless;

pub static REGION: Lazy<String> =
    Lazy::new(|| env::var("LAGON_REGION").expect("LAGON_REGION must be set"));

pub const SNAPSHOT_BLOB: &[u8] = include_bytes!("../snapshot.bin");
