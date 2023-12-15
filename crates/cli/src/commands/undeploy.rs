use crate::utils::{get_root, get_theme, print_progress, Config, FunctionConfig, TrpcClient};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Confirm};
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

    match Confirm::with_theme(get_theme())
        .with_prompt("Do you really want to delete this Deployment?")
        .default(false)
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Deployment");
            TrpcClient::new(config)
                .set_organization_id(function_config.organization_id.clone())
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
            println!(" {} Deployment deleted!", style("◼").magenta());

            Ok(())
        }
        false => {
            println!();
            println!("{} Deletion aborted", style("✕").red());
            Ok(())
        }
    }
}
