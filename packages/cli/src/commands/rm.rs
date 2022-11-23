use anyhow::{anyhow, Result};
use std::path::PathBuf;

use dialoguer::Confirm;
use serde::{Deserialize, Serialize};

use crate::utils::{
    delete_function_config, get_function_config, info, print_progress, success, validate_code_file,
    Config, TrpcClient,
};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteFunctionRequest {
    function_id: String,
}

#[derive(Deserialize, Debug)]
struct DeleteFunctionResponse {}

pub async fn rm(file: PathBuf) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    match get_function_config()? {
        None => Err(anyhow!("No configuration found for this file.")),
        Some(function_config) => match Confirm::new()
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
                            function_id: function_config.function_id,
                        },
                    )
                    .await?;
                end_progress();

                delete_function_config()?;

                println!();
                println!("{}", success("Function deleted."));

                Ok(())
            }
            false => Err(anyhow!("Deletion aborted.")),
        },
    }
}
