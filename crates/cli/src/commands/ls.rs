use anyhow::{anyhow, Result};
use colored::Colorize;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::utils::{
    error, get_function_config, print_progress, validate_code_file, Config, TrpcClient,
};

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

pub async fn ls(file: PathBuf) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    match get_function_config(&file)? {
        None => Err(anyhow!("No configuration found for this file.")),
        Some(function_config) => {
            let end_progress = print_progress("Fetching deployments...");

            let function = TrpcClient::new(&config)
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
                            "(".black(),
                            deployment.created_at.black(),
                            "production".green(),
                            ")".black()
                        );
                    } else {
                        println!(
                            "{} {} {}{}, {}{}",
                            "•".blue(),
                            deployment.id,
                            "(".black(),
                            deployment.created_at.black(),
                            "preview".blue(),
                            ")".black()
                        );
                    }
                }
            }

            Ok(())
        }
    }
}
