mod config;
mod console;
mod deployments;
mod trpc;

use std::path::{Path, PathBuf};

use anyhow::{anyhow, Result};
pub use config::*;
pub use console::*;
pub use deployments::*;
pub use trpc::*;

pub const MAX_FUNCTION_SIZE_MB: usize = 10 * 1024 * 1024; // 10MB
pub const MAX_ASSET_SIZE_MB: u64 = 10 * 1024 * 1024; // 10MB
pub const MAX_ASSETS_PER_FUNCTION: usize = 100;

pub fn validate_code_file(file: &Path) -> Result<()> {
    if !file.exists() || !file.is_file() {
        return Err(anyhow!("{} is not a file", file.to_str().unwrap()));
    }

    match file.extension() {
        Some(ext) => {
            let validate = ext == "js"
                || ext == "jsx"
                || ext == "ts"
                || ext == "tsx"
                || ext == "mjs"
                || ext == "cjs";

            match validate {
                true => Ok(()),
                false => Err(anyhow!("Extension {} is not supported (should be one of .js, .jsx, .ts, .tsx, .mjs, .cjs)", ext.to_str().unwrap())),
            }
        }
        None => Err(anyhow!("No extension found for the given file.",)),
    }
}

pub fn validate_public_dir(public_dir: Option<PathBuf>) -> Result<PathBuf> {
    if let Some(dir) = public_dir {
        if !dir.is_dir() {
            return Err(anyhow!(
                "Public directory {} does not exist.",
                dir.to_str().unwrap()
            ));
        }

        return Ok(dir);
    }

    Ok(PathBuf::from("./public"))
}
