use crate::utils::{get_root, get_theme, print_progress, Config, FunctionConfig, TrpcClient};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Confirm};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct PromoteDeploymentRequest {
    function_id: String,
    deployment_id: String,
}

#[derive(Deserialize, Debug)]
struct PromoteDeploymentResponse {
    #[allow(dead_code)]
    ok: bool,
}

pub async fn promote(deployment_id: String, directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let function_config = FunctionConfig::load(&root, None, None)?;

    match Confirm::with_theme(get_theme())
        .with_prompt("Do you really want to promote this Deployment to production?")
        .default(true)
        .interact()?
    {
        true => {
            println!();
            let end_progress = print_progress("Promoting Deployment");
            TrpcClient::new(config)
                .mutation::<PromoteDeploymentRequest, PromoteDeploymentResponse>(
                    "deploymentPromote",
                    PromoteDeploymentRequest {
                        function_id: function_config.function_id,
                        deployment_id,
                    },
                )
                .await?;
            end_progress();

            println!();
            println!(
                " {} Deployment promoted to production!",
                style("◼").magenta()
            );

            Ok(())
        }
        false => {
            println!();
            println!("{} Promotion aborted", style("✕").red());
            Ok(())
        }
    }
}
