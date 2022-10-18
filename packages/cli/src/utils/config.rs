use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::PathBuf;

#[cfg(debug_assertions)]
static DEFAULT_SITE_URL: &str = "http://localhost:3000";

#[cfg(not(debug_assertions))]
static DEFAULT_SITE_URL: &str = "https://dash.lagon.app";

fn get_config_path() -> PathBuf {
    dirs::home_dir().unwrap().join(".lagon").join("config.json")
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub token: Option<String>,
    pub site_url: String,
}

impl Config {
    pub fn new() -> io::Result<Self> {
        let path = get_config_path();

        if !path.exists() {
            fs::create_dir_all(path.parent().unwrap())?;

            let config = Config {
                token: None,
                site_url: DEFAULT_SITE_URL.to_string(),
            };

            fs::write(path, serde_json::to_string(&config)?)?;

            return Ok(config);
        }

        let config = fs::read_to_string(path)?;
        let config = serde_json::from_str(&config)?;

        Ok(config)
    }

    pub fn save(&self) -> io::Result<()> {
        let path = get_config_path();

        fs::write(path, serde_json::to_string(&self)?)
    }

    pub fn set_token(&mut self, token: Option<String>) {
        self.token = token;
    }

    pub fn set_site_url(&mut self, site_url: String) {
        self.site_url = site_url;
    }
}
