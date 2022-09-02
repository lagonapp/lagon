use std::{env, fs, io, path::Path};

pub struct Deployment {
    pub id: String,
    pub domains: Vec<String>,
    pub assets: Vec<String>,
}

pub fn get_deployment_code(deployment: &Deployment) -> io::Result<String> {
    let path = Path::new(env::current_dir().unwrap().as_path())
        .join("deployments")
        .join(deployment.id.clone() + ".js");
    let code = fs::read_to_string(path)?;

    Ok(code)
}
