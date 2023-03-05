use std::path::PathBuf;

use anyhow::{anyhow, Result};
use dialoguer::Confirm;

use serde::{Deserialize, Serialize};

use crate::utils::{get_root, info, print_progress, success, Config, FunctionConfig, TrpcClient};

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

    match Confirm::new()
        .with_prompt(info("Are you sure you want to delete this Deployment?"))
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Deployment...");
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
            println!("{}", success("Deployment deleted."));

            Ok(())
        }
        false => Err(anyhow!("Deletion aborted.")),
    }
}
