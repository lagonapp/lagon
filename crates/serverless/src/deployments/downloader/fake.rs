use anyhow::Result;
use async_trait::async_trait;
use lagon_runtime_utils::DEPLOYMENTS_DIR;
use std::{fs, path::Path};

use super::Downloader;

pub struct FakeDownloader;

#[async_trait]
impl Downloader for FakeDownloader {
    async fn download(&self, path: String) -> Result<Vec<u8>> {
        let path = Path::new(DEPLOYMENTS_DIR).join(path);
        let bytes = fs::read(path)?;
        Ok(bytes)
    }
}

impl Clone for FakeDownloader {
    fn clone(&self) -> Self {
        Self {}
    }
}
