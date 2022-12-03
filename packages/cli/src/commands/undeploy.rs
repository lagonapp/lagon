use anyhow::{anyhow, Result};
use dialoguer::Confirm;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::utils::{
    get_function_config, info, print_progress, success, validate_code_file, Config, TrpcClient,
};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteDeploymentRequest {
    function_id: String,
    deployment_id: String,
}

#[derive(Deserialize, Debug)]
struct DeleteDeploymentResponse {
    #[allow(dead_code)]
    ok: bool,
}

pub async fn undeploy(file: PathBuf, deployment_id: String) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    match get_function_config(&file)? {
        None => Err(anyhow!("No configuration found for this file.")),
        Some(function_config) => match Confirm::new()
            .with_prompt(info("Are you sure you want to delete this Deployment?"))
            .interact()?
        {
            true => {
                let end_progress = print_progress("Deleting Deployment...");
                TrpcClient::new(&config)
                    .mutation::<DeleteDeploymentRequest, DeleteDeploymentResponse>(
                        "deploymentDelete",
                        DeleteDeploymentRequest {
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
        },
    }
}
