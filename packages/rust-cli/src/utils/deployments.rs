use std::{
    collections::HashMap,
    fs,
    io::{self, Error, ErrorKind},
    path::{Path, PathBuf},
    process::Command,
};

use multipart::{
    client::lazy::Multipart,
    server::nickel::nickel::hyper::{header::Headers, Client},
};
use serde::{Deserialize, Serialize};

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

pub fn write_function_config(config: DeploymentConfig) -> io::Result<()> {
    let path = Path::new(".lagon/config.json");

    if !path.exists() {
        fs::create_dir_all(".lagon")?;
    }

    let content = serde_json::to_string(&config)?;
    fs::write(path, content)
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

pub fn create_deployment(
    function_id: String,
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: PathBuf,
    token: String,
) -> io::Result<()> {
    let (index, assets) = bundle_function(file, client, public_dir)?;

    println!("Uploading files...");

    let mut multipart = Multipart::new();
    multipart.add_text("functionId", function_id);
    multipart.add_stream(
        "code",
        index.as_bytes(),
        Some("index.js"),
        Some(mime::TEXT_JAVASCRIPT),
    );

    for (path, content) in &assets {
        multipart.add_stream(
            "assets",
            content.as_bytes(),
            Some(path),
            Some(mime::TEXT_JAVASCRIPT),
        );
    }

    let client = Client::new();
    let url = get_api_url() + "/deployment";

    let response = multipart
        .client_request_mut(&client, &url, |request| {
            let mut headers = Headers::new();
            headers.set_raw("x-lagon-token", vec![token.as_bytes().to_vec()]);
            request.headers(headers)
        })
        .unwrap();

    println!("{:?}", response);

    println!();
    // println!(createdFunction ? `Function ${functionName} created.` : 'Function deployed.');
    println!();
    // println!(` ➤ ${chalk.gray('https://') + chalk.blueBright.bold(functionName) + chalk.gray('.lagon.app')}`);
    println!(" ➤ https://{}.lagon.app", "TODO");
    println!();

    Ok(())
}
