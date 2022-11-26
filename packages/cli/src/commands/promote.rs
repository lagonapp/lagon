use anyhow::{anyhow, Result};
use dialoguer::Confirm;
use std::path::PathBuf;

use serde::Serialize;

use crate::utils::{
    get_function_config, info, print_progress, success, validate_code_file, Config, TrpcClient,
};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct PromoteDeploymentRequest {
    function_id: String,
    deployment_id: String,
}

pub async fn promote(file: PathBuf, deployment_id: String) -> Result<()> {
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
            .with_prompt(info(
                "Are you sure you want to promote this Deployment to production?",
            ))
            .interact()?
        {
            true => {
                let end_progress = print_progress("Promoting Deployment...");
                TrpcClient::new(&config)
                    .mutation::<PromoteDeploymentRequest, ()>(
                        "deploymentPromote",
                        PromoteDeploymentRequest {
                            function_id: function_config.function_id,
                            deployment_id,
                        },
                    )
                    .await?;
                end_progress();

                println!();
                println!("{}", success("Deployment promoted to production!"));

                Ok(())
            }
            false => Err(anyhow!("Promotion aborted.")),
        },
    }
}
