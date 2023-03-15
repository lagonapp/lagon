mod fake;
mod s3_bucket;

use anyhow::Result;
use async_trait::async_trait;

pub use fake::FakeDownloader;
pub use s3_bucket::S3BucketDownloader;

#[async_trait]
pub trait Downloader {
    async fn download(&self, path: String) -> Result<Vec<u8>>;
}
