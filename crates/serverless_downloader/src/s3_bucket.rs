use anyhow::Result;
use async_trait::async_trait;
use s3::Bucket;

use super::Downloader;

pub struct S3BucketDownloader {
    bucket: Bucket,
}

impl S3BucketDownloader {
    pub fn new(bucket: Bucket) -> Self {
        Self { bucket }
    }
}

#[async_trait]
impl Downloader for S3BucketDownloader {
    async fn download(&self, path: &str) -> Result<Vec<u8>> {
        let object = self.bucket.get_object(path).await?;
        Ok(object.bytes().to_vec())
    }
}
