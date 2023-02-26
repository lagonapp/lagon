use std::path::PathBuf;

use anyhow::{anyhow, Result};
use colored::Colorize;

use serde::{Deserialize, Serialize};

use crate::utils::{error, get_root, print_progress, Config, FunctionConfig, TrpcClient};

#[derive(Deserialize, Debug)]
struct Function {
    deployments: Vec<Deployment>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Deployment {
    id: String,
    created_at: String,
    is_production: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct FunctionRequest {
    function_id: String,
}

type FunctionResponse = Function;

pub async fn ls(directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let function_config = FunctionConfig::load(&root, None, None)?;
    let end_progress = print_progress("Fetching deployments...");

    let function = TrpcClient::new(config)
        .query::<FunctionRequest, FunctionResponse>(
            "functionGet",
            Some(FunctionRequest {
                function_id: function_config.function_id,
            }),
        )
        .await?;

    end_progress();
    println!();

    let deployments = function.result.data.deployments;

    if deployments.is_empty() {
        println!("{}", error("No deployments found."));
    } else {
        for deployment in deployments {
            if deployment.is_production {
                println!(
                    "{} {} {}{}, {}{}",
                    "•".green(),
                    deployment.id,
                    "(".bright_black(),
                    deployment.created_at.bright_black(),
                    "production".green(),
                    ")".bright_black()
                );
            } else {
                println!(
                    "{} {} {}{}, {}{}",
                    "•".blue(),
                    deployment.id,
                    "(".bright_black(),
                    deployment.created_at.bright_black(),
                    "preview".blue(),
                    ")".bright_black()
                );
            }
        }
    }

    Ok(())
}
