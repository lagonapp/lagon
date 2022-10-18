use std::{
    io::{self, Error, ErrorKind},
    path::PathBuf,
};

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

pub async fn undeploy(file: PathBuf) -> io::Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(Error::new(
            ErrorKind::Other,
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    let function_config = get_function_config()?;

    if function_config.is_none() {
        return Err(Error::new(
            ErrorKind::Other,
            "No configuration found in this directory.",
        ));
    }

    let function_config = function_config.unwrap();

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
                        function_id: function_config.function_id,
                    },
                )
                .await
                .unwrap();
            end_progress();

            delete_function_config()?;

            println!();
            println!("{}", success("Function deleted."));

            Ok(())
        }
        false => Err(Error::new(ErrorKind::Other, "Deletion aborted.")),
    }
}
