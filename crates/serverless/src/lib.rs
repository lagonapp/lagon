use lazy_static::lazy_static;
use std::env;

// TODO add back cron jobs
// pub mod cronjob;
pub mod deployments;
pub mod serverless;

lazy_static! {
    pub static ref REGION: String = env::var("LAGON_REGION").expect("LAGON_REGION must be set");
}

pub const SNAPSHOT_BLOB: &[u8] = include_bytes!("../snapshot.bin");
