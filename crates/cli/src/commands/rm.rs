use crate::utils::{get_root, get_theme, print_progress, Config, FunctionConfig, TrpcClient};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Confirm};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteFunctionRequest {
    function_id: String,
}

#[derive(Deserialize, Debug)]
struct DeleteFunctionResponse {
    #[allow(dead_code)]
    ok: bool,
}

pub async fn rm(directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let function_config = FunctionConfig::load(&root, None, None)?;

    match Confirm::with_theme(get_theme())
        .with_prompt(
            "Do you really want to completely delete this Function, its Deployments, statistics and logs?",
        )
        .default(false)
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Function");
            TrpcClient::new(config)
                .set_organization_id(function_config.organization_id.clone())
                .mutation::<DeleteFunctionRequest, DeleteFunctionResponse>(
                    "functionDelete",
                    DeleteFunctionRequest {
                        function_id: function_config.function_id.clone(),
                    },
                )
                .await?;
            end_progress();

            function_config.delete(&root)?;

            println!();
            println!(" {} Function deleted!", style("◼").magenta());

            Ok(())
        }
        false => {
            println!();
            println!("{} Deletion aborted", style("✕").red());
            Ok(())
        },
    }
}
