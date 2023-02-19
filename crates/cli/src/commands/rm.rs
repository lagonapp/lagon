use std::path::PathBuf;

use anyhow::{anyhow, Result};

use dialoguer::Confirm;
use serde::{Deserialize, Serialize};

use crate::utils::{get_root, info, print_progress, success, Config, FunctionConfig, TrpcClient};

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

    match Confirm::new()
        .with_prompt(info(
            "Are you sure you want to completely delete this Function?",
        ))
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Function...");
            TrpcClient::new(&config)
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
            println!("{}", success("Function deleted."));

            Ok(())
        }
        false => Err(anyhow!("Deletion aborted.")),
    }
}
