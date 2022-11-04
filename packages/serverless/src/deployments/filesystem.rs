use std::io::Write;
use std::path::PathBuf;
use std::{env, fs, path::Path};

use anyhow::Result;
use log::info;

use super::Deployment;

pub fn create_deployments_folder() -> Result<()> {
    let path = Path::new("deployments");

    if !path.exists() {
        fs::create_dir(path)?;
        info!("Created deployments folder");
    }

    Ok(())
}

pub fn has_deployment_code(deployment: &Deployment) -> bool {
    let path = Path::new("deployments").join(deployment.id.clone() + ".js");

    path.exists()
}

pub fn get_deployment_code(deployment: &Deployment) -> Result<String> {
    let path = Path::new(env::current_dir()?.as_path())
        .join("deployments")
        .join(deployment.id.clone() + ".js");
    let code = fs::read_to_string(path)?;

    Ok(code)
}

pub fn write_deployment(deployment_id: &str, buf: &[u8]) -> Result<()> {
    let mut file =
        fs::File::create(Path::new("deployments").join(deployment_id.to_owned() + ".js"))?;

    file.write_all(buf)?;
    info!("Wrote deployment: {}", deployment_id);

    Ok(())
}

pub fn write_deployment_asset(deployment_id: &str, asset: &str, buf: &[u8]) -> Result<()> {
    let asset = asset.replace("public/", "");
    let asset = asset.as_str();

    let dir = PathBuf::from("deployments")
        .join(deployment_id)
        .join(PathBuf::from(asset).parent().unwrap());
    fs::create_dir_all(dir)?;

    let mut file =
        fs::File::create(Path::new("deployments").join(deployment_id.to_owned() + "/" + asset))?;

    file.write_all(buf)?;
    info!("Wrote deployment ({}) asset: {}", deployment_id, asset);

    Ok(())
}

pub fn rm_deployment(deployment_id: &str) -> Result<()> {
    fs::remove_file(Path::new("deployments").join(deployment_id.to_owned() + ".js"))?;

    // It's possible that the folder doesn't exists if the deployment has no assets
    fs::remove_dir_all(Path::new("deployments").join(deployment_id)).unwrap_or(());
    info!("Deleted deployment: {}", deployment_id);

    Ok(())
}
