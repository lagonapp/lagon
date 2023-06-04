use once_cell::sync::Lazy;
use std::env;

pub mod clickhouse;
pub mod cronjob;
pub mod deployments;
pub mod serverless;

pub static REGION: Lazy<String> =
    Lazy::new(|| env::var("LAGON_REGION").expect("LAGON_REGION must be set"));

pub const SNAPSHOT_BLOB: &[u8] = include_bytes!("../snapshot.bin");
