use std::{
    io::{self, Error, ErrorKind},
    path::PathBuf,
};

use dialoguer::Confirm;
use serde::{Deserialize, Serialize};

use crate::{
    auth::get_token,
    utils::{
        delete_function_config, get_function_config, info, print_progress, success,
        validate_code_file, TrpcClient,
    },
};

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DeleteFunctionRequest {
    function_id: String,
}

#[derive(Deserialize, Debug)]
struct DeleteFunctionResponse {}

pub async fn undeploy(file: PathBuf) -> io::Result<()> {
    let token = get_token()?;

    if token.is_none() {
        return Err(Error::new(
            ErrorKind::Other,
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    let token = token.unwrap();

    validate_code_file(&file)?;

    let config = get_function_config()?;

    if config.is_none() {
        return Err(Error::new(
            ErrorKind::Other,
            "No configuration found in this directory.",
        ));
    }

    let config = config.unwrap();

    match Confirm::new()
        .with_prompt(info(
            "Are you sure you want to completely delete this Function?",
        ))
        .interact()?
    {
        true => {
            let end_progress = print_progress("Deleting Function...");
            TrpcClient::new(&token)
                .mutation::<DeleteFunctionRequest, DeleteFunctionResponse>(
                    "functionDelete",
                    DeleteFunctionRequest {
                        function_id: config.function_id,
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
