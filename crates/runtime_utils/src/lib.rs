use anyhow::{anyhow, Result};

use std::{
    collections::{HashMap, HashSet},
    env,
    fs::{self, File},
    io::Write,
    path::Path,
};

pub mod assets;
pub mod response;

#[cfg(not(feature = "test"))]
pub const DEPLOYMENTS_DIR: &str = "deployments";

#[cfg(feature = "test")]
pub const DEPLOYMENTS_DIR: &str = "deployments_test";

#[derive(Debug, Clone)]
pub struct Deployment {
    pub id: String,
    pub function_id: String,
    pub function_name: String,
    pub domains: HashSet<String>,
    pub assets: HashSet<String>,
    pub environment_variables: HashMap<String, String>,
    pub memory: usize,        // in MB (MegaBytes)
    pub tick_timeout: usize,  // in ms (MilliSeconds)
    pub total_timeout: usize, // in ms (MilliSeconds)
    pub is_production: bool,
    pub cron: Option<String>,
}

impl Deployment {
    pub fn get_domains(&self) -> Vec<String> {
        let mut domains = Vec::new();

        domains.push(format!(
            "{}.{}",
            self.id,
            env::var("LAGON_ROOT_DOMAIN").expect("LAGON_ROOT_DOMAIN must be set")
        ));

        // Default domain (function's name) and custom domains are only set in production deployments
        if self.is_production {
            domains.push(format!(
                "{}.{}",
                self.function_name,
                env::var("LAGON_ROOT_DOMAIN").expect("LAGON_ROOT_DOMAIN must be set")
            ));

            domains.extend(self.domains.clone());
        }

        domains
    }

    pub fn should_run_cron(&self) -> bool {
        self.is_production && self.cron.is_some()
    }

    pub fn get_code(&self) -> Result<String> {
        let path = Path::new(env::current_dir()?.as_path())
            .join(DEPLOYMENTS_DIR)
            .join(self.id.clone() + ".js");
        let code = fs::read_to_string(path)?;

        Ok(code)
    }

    pub fn has_code(&self) -> bool {
        let path = Path::new(DEPLOYMENTS_DIR).join(self.id.clone() + ".js");

        path.exists()
    }

    pub fn write_code(&self, code: &[u8]) -> Result<()> {
        let mut file = File::create(Path::new(DEPLOYMENTS_DIR).join(self.id.clone() + ".js"))?;

        file.write_all(code)?;

        Ok(())
    }

    pub fn write_asset(&self, asset: &str, content: &[u8]) -> Result<()> {
        let asset = asset.replace("public/", "");
        let asset = asset.as_str();

        let dir = Path::new(DEPLOYMENTS_DIR).join(self.id.clone()).join(
            Path::new(asset)
                .parent()
                .ok_or_else(|| anyhow!("Could not get parent of {}", asset))?,
        );
        fs::create_dir_all(dir)?;

        let mut file =
            File::create(Path::new(DEPLOYMENTS_DIR).join(self.id.clone() + "/" + asset))?;
        file.write_all(content)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deployment_default_domains() {
        env::set_var("LAGON_ROOT_DOMAIN", "lagon.test");

        let deployment = Deployment {
            id: "123".into(),
            function_id: "456".into(),
            function_name: "hello".into(),
            domains: HashSet::new(),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: false,
            cron: None,
        };

        assert_eq!(deployment.get_domains(), vec!["123.lagon.test".to_owned()]);
    }

    #[test]
    fn deployment_domains() {
        env::set_var("LAGON_ROOT_DOMAIN", "lagon.test");

        let deployment = Deployment {
            id: "123".into(),
            function_id: "456".into(),
            function_name: "hello".into(),
            domains: HashSet::from_iter(vec!["lagon.app".to_owned()]),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: false,
            cron: None,
        };

        assert_eq!(deployment.get_domains(), vec!["123.lagon.test".to_owned(),]);
    }

    #[test]
    fn deployment_domains_production() {
        env::set_var("LAGON_ROOT_DOMAIN", "lagon.test");

        let deployment = Deployment {
            id: "123".into(),
            function_id: "456".into(),
            function_name: "hello".into(),
            domains: HashSet::from_iter(vec!["lagon.app".to_owned()]),
            assets: HashSet::new(),
            environment_variables: HashMap::new(),
            memory: 128,
            tick_timeout: 1000,
            total_timeout: 1000,
            is_production: true,
            cron: None,
        };

        assert_eq!(
            deployment.get_domains(),
            vec![
                "123.lagon.test".to_owned(),
                "hello.lagon.test".to_owned(),
                "lagon.app".to_owned()
            ]
        );
    }
}
