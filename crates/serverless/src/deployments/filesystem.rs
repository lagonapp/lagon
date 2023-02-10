use std::{fs, path::Path};

use anyhow::Result;
use log::info;

pub fn create_deployments_folder() -> Result<()> {
    let path = Path::new("deployments");

    if !path.exists() {
        fs::create_dir(path)?;
        info!("Created deployments folder");
    }

    Ok(())
}

pub fn rm_deployment(deployment_id: &str) -> Result<()> {
    fs::remove_file(Path::new("deployments").join(deployment_id.to_owned() + ".js"))?;

    // It's possible that the folder doesn't exists if the deployment has no assets
    fs::remove_dir_all(Path::new("deployments").join(deployment_id)).unwrap_or(());
    info!(deployment = deployment_id; "Deleted deployment");

    Ok(())
}
