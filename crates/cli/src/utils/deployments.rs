use anyhow::{anyhow, Result};
use colored::Colorize;
use dialoguer::{Confirm, Input};
use hyper::{Body, Method, Request};
use std::sync::Arc;
use std::{
    collections::HashMap,
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    process::Command,
};
use walkdir::{DirEntry, WalkDir};

use pathdiff::diff_paths;
use serde::{Deserialize, Serialize};

use crate::utils::{debug, info, print_progress, success, TrpcClient};

use super::{
    validate_assets_dir, validate_code_file, Config, MAX_ASSETS_PER_FUNCTION, MAX_ASSET_SIZE_MB,
    MAX_FUNCTION_SIZE_MB,
};

pub type Assets = HashMap<String, Vec<u8>>;

#[cfg(windows)]
const ESBUILD: &str = "C:\\Program Files\\nodejs\\esbuild.cmd";

#[cfg(not(windows))]
const ESBUILD: &str = "esbuild";

#[derive(Serialize, Deserialize, Debug)]
pub struct FunctionConfig {
    pub function_id: String,
    pub organization_id: String,
    pub index: PathBuf,
    pub client: Option<PathBuf>,
    pub assets: Option<PathBuf>,
}

impl FunctionConfig {
    pub fn load(
        root: &Path,
        client_override: Option<PathBuf>,
        assets_override: Option<PathBuf>,
    ) -> Result<FunctionConfig> {
        let path = get_function_config_path(root);

        if !path.exists() {
            println!(
                "{}",
                debug("No configuration found in current directory...")
            );
            println!();

            let index = match client_override {
                Some(index) => {
                    println!("{}", debug("Using custom entrypoint..."));
                    index
                }
                None => {
                    let index = Input::<String>::new()
                        .with_prompt(format!(
                            "{} {}",
                            info("Path to your Function's entrypoint?"),
                            debug(
                                format!("(relative to {:?})", root.canonicalize().unwrap())
                                    .as_str()
                            ),
                        ))
                        .interact_text()?;
                    PathBuf::from(index)
                }
            };

            validate_code_file(&root.join(&index), root)?;

            let assets = match assets_override {
                Some(assets) => {
                    println!("{}", debug("Using custom public directory..."));
                    Some(assets)
                }
                None => match Confirm::new()
                    .with_prompt(info("Do you have a public directory to serve assets from?"))
                    .interact()?
                {
                    true => {
                        let assets = Input::<String>::new()
                            .with_prompt(format!(
                                "{} {}",
                                info("Path to your Function's public directory?"),
                                debug(
                                    format!("(relative to {:?})", root.canonicalize().unwrap())
                                        .as_str()
                                ),
                            ))
                            .interact_text()?;
                        let assets = PathBuf::from(assets);

                        validate_assets_dir(&Some(root.join(&assets)), root)?;

                        Some(assets)
                    }
                    false => None,
                },
            };

            let config = FunctionConfig {
                function_id: String::from(""),
                organization_id: String::from(""),
                index,
                client: None,
                assets,
            };

            config.write(root)?;

            return Ok(config);
        }

        let content = fs::read_to_string(path)?;
        let mut config = serde_json::from_str::<FunctionConfig>(&content)?;

        if let Some(client_override) = client_override {
            println!("{}", debug("Using custom entrypoint..."));
            config.client = Some(client_override);
        }

        if let Some(assets_override) = assets_override {
            println!("{}", debug("Using custom public directory..."));
            config.assets = Some(assets_override);
        }

        validate_code_file(&config.index, root)?;

        if let Some(client) = &config.client {
            validate_code_file(client, root)?;
        }

        validate_assets_dir(&config.assets, root)?;

        Ok(config)
    }

    pub fn write(&self, root: &Path) -> Result<()> {
        let path = get_function_config_path(root);

        if !path.exists() {
            fs::create_dir_all(root.join(".lagon"))?;
        }

        let content = serde_json::to_string(self)?;
        fs::write(path, content)?;
        Ok(())
    }

    pub fn delete(&self, root: &Path) -> Result<()> {
        let path = get_function_config_path(root);

        if !path.exists() {
            return Err(anyhow!("No configuration found in this directory.",));
        }

        fs::remove_file(path)?;
        Ok(())
    }
}

pub fn get_root(root: Option<PathBuf>) -> PathBuf {
    match root {
        Some(path) => path,
        None => std::env::current_dir().unwrap(),
    }
}

pub fn get_function_config_path(root: &Path) -> PathBuf {
    root.join(".lagon").join("config.json")
}

fn esbuild(file: &Path, root: &Path) -> Result<Vec<u8>> {
    let result = Command::new(ESBUILD)
        .arg(root.join(file))
        .arg("--define:process.env.NODE_ENV=\"production\"")
        .arg("--bundle")
        .arg("--format=esm")
        .arg("--target=esnext")
        .arg("--platform=browser")
        .arg("--conditions=lagon")
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

pub fn bundle_function(function_config: &FunctionConfig, root: &Path) -> Result<(Vec<u8>, Assets)> {
    if let Err(error) = Command::new(ESBUILD).arg("--version").output() {
        return if error.kind() == ErrorKind::NotFound {
            Err(anyhow!(
                "Could not find ESBuild. Please install it with `npm install -g esbuild`",
            ))
        } else {
            Err(anyhow!(
                "An error occured while running ESBuild: {:?}",
                error
            ))
        };
    }

    let end_progress = print_progress("Bundling Function handler...");
    let index_output = esbuild(&function_config.index, root)?;
    end_progress();

    let mut final_assets = Assets::new();

    if let Some(client) = &function_config.client {
        let end_progress = print_progress("Bundling client file...");
        let client_output = esbuild(client, root)?;
        end_progress();

        let client_path = client.as_path().with_extension("js");
        let client_path = client_path.file_name().unwrap();

        if let Some(assets) = &function_config.assets {
            let client_path = assets.join(client_path);
            fs::write(client_path, &client_output)?;
        }

        final_assets.insert(
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

    if let Some(assets) = &function_config.assets {
        let assets = root.join(assets);
        let msg = format!(
            "Found public directory ({:?}), bundling assets...",
            assets.canonicalize().unwrap()
        );
        let end_progress = print_progress(&msg);

        let files = WalkDir::new(&assets)
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

                let diff = diff_paths(path, &assets)
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .to_string();
                let file_content = fs::read(path)?;

                final_assets.insert(diff, file_content);
            }
        }

        end_progress();
    } else {
        println!("{}", debug("No public directory found, skipping..."));
    }

    Ok((index_output, final_assets))
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
    config: Config,
    function_config: &FunctionConfig,
    prod: bool,
    root: &Path,
) -> Result<()> {
    let (index, assets) = bundle_function(function_config, root)?;

    let end_progress = print_progress("Creating deployment...");

    let trpc_client = Arc::new(TrpcClient::new(config));
    let response = trpc_client
        .mutation::<CreateDeploymentRequest, CreateDeploymentResponse>(
            "deploymentCreate",
            CreateDeploymentRequest {
                function_id: function_config.function_id.clone(),
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

    let mut join_set = tokio::task::JoinSet::new();
    for (asset, url) in assets_urls {
        let asset = assets
            .get(&asset)
            .unwrap_or_else(|| panic!("Couldn't find asset {asset}"));

        join_set.spawn(upload_asset(trpc_client.clone(), asset.clone(), url));
    }

    while let Some(res) = join_set.join_next().await {
        res?.expect("Couldn't upload asset");
    }

    end_progress();

    let response = trpc_client
        .mutation::<DeployDeploymentRequest, DeployDeploymentResponse>(
            "deploymentDeploy",
            DeployDeploymentRequest {
                function_id: function_config.function_id.clone(),
                deployment_id,
                is_production: prod,
            },
        )
        .await?;

    println!();
    println!("{}", success("Function deployed!"));

    if !prod {
        println!("{}", debug("Use --prod to deploy to production"));
    }

    println!();
    println!(
        " {} {}",
        "➤".bright_black(),
        response.result.data.url.blue()
    );

    Ok(())
}

async fn upload_asset(trpc_client: Arc<TrpcClient>, asset: Vec<u8>, url: String) -> Result<()> {
    let request = Request::builder()
        .method(Method::PUT)
        .uri(url)
        .body(Body::from(asset))?;

    trpc_client.client.request(request).await?;
    Ok(())
}
