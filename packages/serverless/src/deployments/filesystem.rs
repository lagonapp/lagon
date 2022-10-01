use std::io::Write;
use std::path::PathBuf;
use std::{env, fs, io, path::Path};

use super::Deployment;

pub fn create_deployments_folder() -> io::Result<()> {
    let path = Path::new("deployments");

    if !path.exists() {
        fs::create_dir(path)?;
    }

    Ok(())
}

pub fn has_deployment_code(deployment: &Deployment) -> bool {
    let path = Path::new("deployments").join(deployment.id.clone() + ".js");

    path.exists()
}

pub fn get_deployment_code(deployment: &Deployment) -> io::Result<String> {
    let path = Path::new(env::current_dir().unwrap().as_path())
        .join("deployments")
        .join(deployment.id.clone() + ".js");
    let code = fs::read_to_string(path)?;

    Ok(code)
}

pub fn write_deployment(deployment_id: String, buf: &[u8]) -> io::Result<()> {
    let mut file = fs::File::create(Path::new("deployments").join(deployment_id + ".js"))?;

    file.write_all(buf)?;

    Ok(())
}

pub fn write_deployment_asset(deployment_id: String, asset: &str, buf: &[u8]) -> io::Result<()> {
    let asset = asset.replace("public/", "");
    let asset = asset.as_str();

    let dir = PathBuf::from("deployments")
        .join(&deployment_id)
        .join(PathBuf::from(asset).parent().unwrap());
    fs::create_dir_all(dir)?;

    let mut file = fs::File::create(Path::new("deployments").join(deployment_id + "/" + asset))?;

    file.write_all(buf)?;

    Ok(())
}

pub fn rm_deployment(deployment_id: String) -> io::Result<()> {
    fs::remove_file(Path::new("deployments").join(deployment_id.clone() + ".js"))?;

    // It's possible that folder doesn't exists
    fs::remove_dir(Path::new("deployments").join(deployment_id)).unwrap_or(());

    Ok(())
}
