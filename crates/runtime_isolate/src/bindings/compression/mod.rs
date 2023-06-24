use anyhow::{anyhow, Result};
use flate2::write::DeflateDecoder;
use flate2::write::DeflateEncoder;
use flate2::write::GzDecoder;
use flate2::write::GzEncoder;
use flate2::write::ZlibDecoder;
use flate2::write::ZlibEncoder;

mod create;
mod finish;
mod write;

pub use create::compression_create_binding;
pub use finish::compression_finish_binding;
pub use write::compression_write_binding;

#[derive(Debug)]
pub enum CompressionInner {
    DeflateDecoder(ZlibDecoder<Vec<u8>>),
    DeflateEncoder(ZlibEncoder<Vec<u8>>),
    DeflateRawDecoder(DeflateDecoder<Vec<u8>>),
    DeflateRawEncoder(DeflateEncoder<Vec<u8>>),
    GzDecoder(GzDecoder<Vec<u8>>),
    GzEncoder(GzEncoder<Vec<u8>>),
}

pub enum CompressionFormat {
    Gz,
    Deflate,
    DeflateRaw,
}

impl TryFrom<&str> for CompressionFormat {
    type Error = anyhow::Error;

    fn try_from(str: &str) -> Result<CompressionFormat> {
        match str {
            "gzip" => Ok(CompressionFormat::Gz),
            "deflate" => Ok(CompressionFormat::Deflate),
            "deflate-raw" => Ok(CompressionFormat::DeflateRaw),
            _ => Err(anyhow!("Compression format not supported")),
        }
    }
}
