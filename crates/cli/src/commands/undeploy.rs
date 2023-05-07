use crate::utils::{get_root, print_progress, Config, FunctionConfig, TrpcClient, THEME};
use anyhow::{anyhow, Result};
use colored::Colorize;
use dialoguer::Confirm;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct UndeployDeploymentRequest {
    function_id: String,
    deployment_id: String,
}

#[derive(Deserialize, Debug)]
struct UndeployDeploymentResponse {
    #[allow(dead_code)]
    ok: bool,
}

pub async fn undeploy(deployment_id: String, directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let function_config = FunctionConfig::load(&root, None, None)?;

    match Confirm::with_theme(&*THEME)
        .with_prompt("Do you really want to delete this Deployment?")
        .default(false)
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Deployment");
            TrpcClient::new(config)
                .mutation::<UndeployDeploymentRequest, UndeployDeploymentResponse>(
                    "deploymentUndeploy",
                    UndeployDeploymentRequest {
                        function_id: function_config.function_id,
                        deployment_id,
                    },
                )
                .await?;
            end_progress();

            println!();
            println!(" {} Deployment deleted!", "◼".magenta());

            Ok(())
        }
        false => {
            println!();
            println!("{} Deletion aborted", "✕".red());
            Ok(())
        }
    }
}
