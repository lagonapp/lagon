use anyhow::Result;
use async_trait::async_trait;
use s3::{creds::Credentials, Bucket};
use std::env;

mod fake;
mod s3_bucket;

pub use fake::FakeDownloader;
pub use s3_bucket::S3BucketDownloader;

pub fn get_bucket() -> Result<Bucket> {
    let bucket_name = env::var("S3_BUCKET").expect("S3_BUCKET must be set");
    let bucket_region = env::var("S3_REGION").expect("S3_REGION must be set");
    let credentials = Credentials::new(
        Some(&env::var("S3_ACCESS_KEY_ID").expect("S3_ACCESS_KEY_ID must be set")),
        Some(&env::var("S3_SECRET_ACCESS_KEY").expect("S3_SECRET_ACCESS_KEY must be set")),
        None,
        None,
        None,
    )?;

    Ok(Bucket::new(
        &bucket_name,
        bucket_region.parse()?,
        credentials,
    )?)
}

#[async_trait]
pub trait Downloader {
    async fn download(&self, path: String) -> Result<Vec<u8>>;
}
