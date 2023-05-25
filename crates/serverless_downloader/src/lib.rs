use anyhow::Result;
use async_trait::async_trait;
use s3::{creds::Credentials, Bucket, Region};
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

    let endpoint = env::var("S3_ENDPOINT");
    let bucket = if endpoint.is_ok() {
        Bucket::new(
            &bucket_name,
            Region::Custom {
                region: bucket_region.parse()?,
                endpoint: endpoint.unwrap(),
            },
            credentials,
        )?
        .with_path_style()
    } else {
        Bucket::new(&bucket_name, bucket_name.parse()?, credentials)?
    };

    Ok(bucket)
}

#[async_trait]
pub trait Downloader {
    async fn download(&self, path: String) -> Result<Vec<u8>>;
}
