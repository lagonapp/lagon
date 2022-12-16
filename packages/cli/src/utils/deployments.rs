use anyhow::{anyhow, Result};
use colored::Colorize;
use hyper::{Body, Method, Request};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
};
use walkdir::{DirEntry, WalkDir};

use pathdiff::diff_paths;
use serde::{Deserialize, Serialize};

use crate::utils::{debug, print_progress, success, TrpcClient};

use super::{Config, MAX_ASSETS_PER_FUNCTION, MAX_ASSET_SIZE_MB, MAX_FUNCTION_SIZE_MB};

pub type Assets = HashMap<String, Vec<u8>>;

#[derive(Serialize, Deserialize, Debug)]
pub struct DeploymentConfig {
    pub function_id: String,
    pub organization_id: String,
}

pub fn get_function_config(file: &Path) -> Result<Option<DeploymentConfig>> {
    let path = format!(
        ".lagon/{}.json",
        file.file_name().unwrap().to_str().unwrap()
    );
    let path = Path::new(&path);

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path)?;
    let config = serde_json::from_str::<DeploymentConfig>(&content)?;

    Ok(Some(config))
}

pub fn write_function_config(file: &Path, config: DeploymentConfig) -> Result<()> {
    let path = format!(
        ".lagon/{}.json",
        file.file_name().unwrap().to_str().unwrap()
    );
    let path = Path::new(&path);

    if !path.exists() {
        fs::create_dir_all(".lagon")?;
    }

    let content = serde_json::to_string(&config)?;
    fs::write(path, content)?;
    Ok(())
}

pub fn delete_function_config(file: &Path) -> Result<()> {
    let path = format!(
        ".lagon/{}.json",
        file.file_name().unwrap().to_str().unwrap()
    );
    let path = Path::new(&path);

    if !path.exists() {
        return Err(anyhow!("No configuration found in this directory.",));
    }

    fs::remove_file(path)?;
    Ok(())
}

fn esbuild(file: &PathBuf) -> Result<Vec<u8>> {
    let result = Command::new("esbuild")
        .arg(file)
        .arg("--bundle")
        .arg("--format=esm")
        .arg("--target=es2020")
        .arg("--platform=browser")
        .arg("--loader:.wasm=binary")
        .output()?;

    // TODO: check status code
    if result.status.success() {
        let output = result.stdout;

        if output.len() >= MAX_FUNCTION_SIZE_MB {
            return Err(anyhow!(
                "Function can't be larger than {} bytes",
                MAX_FUNCTION_SIZE_MB
            ));
        }

        return Ok(output);
    }

    Err(anyhow!(
        "Unexpected status code {}:\n\n{}",
        result.status.code().unwrap_or(0),
        String::from_utf8(result.stderr).unwrap_or_else(|_| "Unknown error.".to_string())
    ))
}

pub fn bundle_function(
    index: &PathBuf,
    client: &Option<PathBuf>,
    public_dir: &PathBuf,
) -> Result<(Vec<u8>, Assets)> {
    if Command::new("esbuild").arg("--version").output().is_err() {
        return Err(anyhow!(
            "esbuild is not installed. Please install it with `npm install -g esbuild`",
        ));
    }

    let end_progress = print_progress("Bundling Function handler...");
    let index_output = esbuild(index)?;
    end_progress();

    let mut assets = Assets::new();

    if let Some(client) = client {
        let end_progress = print_progress("Bundling client file...");
        let client_output = esbuild(client)?;
        end_progress();

        assets.insert(
            client
                .as_path()
                .file_stem()
                .unwrap()
                .to_str()
                .unwrap()
                .to_string()
                + ".js",
            client_output,
        );
    }

    if public_dir.exists() && public_dir.is_dir() {
        let msg = format!(
            "Found public directory ({}), bundling assets...",
            public_dir.display()
        );
        let end_progress = print_progress(&msg);

        let files = WalkDir::new(public_dir)
            .into_iter()
            .collect::<Vec<walkdir::Result<DirEntry>>>();

        if files.len() >= MAX_ASSETS_PER_FUNCTION {
            return Err(anyhow!(
                "Too many assets in public directory, max is {}",
                MAX_ASSETS_PER_FUNCTION
            ));
        }

        for file in files {
            let file = file?;
            let path = file.path();

            if path.is_file() {
                if path.metadata()?.len() >= MAX_ASSET_SIZE_MB {
                    return Err(anyhow!(
                        "File {:?} can't be larger than {} bytes",
                        path,
                        MAX_ASSET_SIZE_MB
                    ));
                }

                let diff = diff_paths(path, public_dir)
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .to_string();
                let file_content = fs::read(path)?;

                assets.insert(diff, file_content);
            }
        }

        end_progress();
    } else {
        println!("{}", debug("No public directory found, skipping..."));
    }

    Ok((index_output, assets))
}

#[derive(Serialize, Debug)]
struct Asset {
    name: String,
    size: usize,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CreateDeploymentRequest {
    function_id: String,
    function_size: usize,
    assets: Vec<Asset>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CreateDeploymentResponse {
    deployment_id: String,
    code_url: String,
    assets_urls: HashMap<String, String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeployDeploymentRequest {
    function_id: String,
    deployment_id: String,
    is_production: bool,
}

#[derive(Deserialize, Debug)]
struct DeployDeploymentResponse {
    url: String,
}

pub async fn create_deployment(
    function_id: String,
    file: &PathBuf,
    client: &Option<PathBuf>,
    public_dir: &PathBuf,
    config: &Config,
    prod: bool,
) -> Result<()> {
    let (index, assets) = bundle_function(file, client, public_dir)?;

    let end_progress = print_progress("Creating deployment...");

    let trpc_client = TrpcClient::new(config);
    let response = trpc_client
        .mutation::<CreateDeploymentRequest, CreateDeploymentResponse>(
            "deploymentCreate",
            CreateDeploymentRequest {
                function_id: function_id.clone(),
                function_size: index.len(),
                assets: assets
                    .iter()
                    .map(|(key, value)| Asset {
                        name: key.clone(),
                        size: value.len(),
                    })
                    .collect(),
            },
        )
        .await?;

    end_progress();

    let CreateDeploymentResponse {
        deployment_id,
        code_url,
        assets_urls,
    } = response.result.data;

    let end_progress = print_progress("Uploading files...");

    let request = Request::builder()
        .method(Method::PUT)
        .uri(code_url)
        .body(Body::from(index))?;

    trpc_client.client.request(request).await?;

    // TODO upload in parallel
    for (asset, url) in assets_urls {
        let asset = assets
            .get(&asset)
            .unwrap_or_else(|| panic!("Couldn't find asset {}", asset));

        let request = Request::builder()
            .method(Method::PUT)
            .uri(url)
            .body(Body::from(asset.clone()))?;

        trpc_client.client.request(request).await?;
    }

    end_progress();

    let response = trpc_client
        .mutation::<DeployDeploymentRequest, DeployDeploymentResponse>(
            "deploymentDeploy",
            DeployDeploymentRequest {
                function_id,
                deployment_id,
                is_production: prod,
            },
        )
        .await?;

    println!();
    println!("{}", success("Function deployed!"));
    println!();
    println!(" {} {}", "➤".black(), response.result.data.url.blue());
    println!();

    Ok(())
}
