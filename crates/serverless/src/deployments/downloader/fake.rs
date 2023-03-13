use anyhow::Result;
use async_trait::async_trait;

use super::Downloader;

pub struct FakeDownloader;

#[async_trait]
impl Downloader for FakeDownloader {
    async fn download(&self, _path: String) -> Result<Vec<u8>> {
        Ok(vec![])
    }
}

impl Clone for FakeDownloader {
    fn clone(&self) -> Self {
        Self {}
    }
}
