use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[cfg(debug_assertions)]
fn get_site_url() -> String {
    "http://localhost:3000".to_string()
}

#[cfg(not(debug_assertions))]
fn get_site_url() -> String {
    "https://dash.lagon.app".to_string()
}

fn get_config_path() -> Result<PathBuf> {
    Ok(dirs::home_dir()
        .ok_or_else(|| anyhow!("Could not find home directory"))?
        .join(".lagon")
        .join("config.json"))
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    pub token: Option<String>,
    pub site_url: String,
}

impl Config {
    pub fn new() -> Result<Self> {
        let path = get_config_path()?;

        if !path.exists() {
            fs::create_dir_all(
                path.parent()
                    .ok_or_else(|| anyhow!("Could not find parent of {:?}", path))?,
            )?;

            let config = Config {
                token: None,
                site_url: get_site_url(),
            };

            fs::write(path, serde_json::to_string(&config)?)?;

            return Ok(config);
        }

        let config = fs::read_to_string(path)?;
        let config = serde_json::from_str(&config)?;

        Ok(config)
    }

    pub fn save(&self) -> Result<()> {
        let path = get_config_path()?;

        fs::write(path, serde_json::to_string(&self)?)?;
        Ok(())
    }

    pub fn set_token(&mut self, token: Option<String>) {
        self.token = token;
    }
}
