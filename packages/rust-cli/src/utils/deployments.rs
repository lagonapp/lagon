use std::{
    collections::HashMap,
    io::{self, Error, ErrorKind},
    path::{PathBuf, Path},
    process::Command, fs,
};

use serde::{Serialize, Deserialize};

use crate::utils::get_api_url;

#[derive(Serialize, Deserialize, Debug)]
pub struct DeploymentConfig {
    pub function_id: String,
    pub organization_id: String,
}

pub fn get_function_config() -> io::Result<Option<DeploymentConfig>> {
    let path = Path::new(".lagon/config.json");

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path)?;
    let config = serde_json::from_str::<DeploymentConfig>(&content)?;

    Ok(Some(config))
}

fn esbuild(file: &PathBuf) -> io::Result<String> {
    let result = Command::new("esbuild")
        .arg(file)
        .arg("--bundle")
        .arg("--format=esm")
        .arg("--target=es2020")
        .arg("--platform=browser")
        .output()?;

    // TODO: check status code
    if result.status.success() {
        let output = result.stdout;

        return match String::from_utf8(output) {
            Ok(s) => Ok(s),
            Err(_) => Err(Error::new(
                ErrorKind::Other,
                "Failed to convert output to string",
            )),
        };
    }

    Err(Error::new(
        ErrorKind::Other,
        format!("Unexpected status code {}", result.status),
    ))
}

pub fn bundle_function(
    index: PathBuf,
    client: Option<PathBuf>,
    public_dir: PathBuf,
) -> io::Result<(String, HashMap<String, String>)> {
    if let Err(_) = Command::new("esbuild").arg("--version").output() {
        return Err(Error::new(
            ErrorKind::Other,
            "esbuild is not installed. Please install it with `npm install -g esbuild`",
        ));
    }

    let index_output = esbuild(&index)?;
    let mut assets = HashMap::<String, String>::new();

    if let Some(client) = client {
        let client_output = esbuild(&client)?;

        assets.insert(
            client.into_os_string().into_string().unwrap(),
            client_output,
        );
    }

    Ok((index_output, assets))
}

pub fn create_deployment(function_id: String, file: PathBuf, client: Option<PathBuf>, public_dir: PathBuf) -> io::Result<()> {
    let (index, assets) = bundle_function(file, client, public_dir)?;

    println!("Uploading files...");

    let code_part = reqwest::blocking::multipart::Part::text(index)
        .file_name("index.js")
        .mime_str("text/javascript").unwrap();

    let form = reqwest::blocking::multipart::Form::new()
        .text("functionId", function_id)
        .part("code", code_part);

    for (path, content) in assets {
        let asset_part = reqwest::blocking::multipart::Part::text(content)
            .file_name(path)
            // TODO: get mime type from file extension
            .mime_str("text/javascript").unwrap();

        form.part("assets", asset_part);
    }

    let client = reqwest::blocking::Client::new();
    let response = client.post(get_api_url() + "/deployment").multipart(form).header("x-lagon-token", "").send();

    println!();
    // println!(createdFunction ? `Function ${functionName} created.` : 'Function deployed.');
    println!();
    // println!(` ➤ ${chalk.gray('https://') + chalk.blueBright.bold(functionName) + chalk.gray('.lagon.app')}`);
    println!();

    Ok(())
}
