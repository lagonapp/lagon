use anyhow::{anyhow, Result};
use std::path::PathBuf;

use dialoguer::Select;

use crate::{
    commands::deploy::{FunctionsResponse, OrganizationsResponse},
    utils::{
        debug, get_function_config, success, validate_code_file, write_function_config, Config,
        DeploymentConfig, TrpcClient,
    },
};

pub async fn link(file: PathBuf) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    match get_function_config(&file)? {
        None => {
            println!("{}", debug("No deployment config found..."));
            println!();

            let trpc_client = TrpcClient::new(&config);
            let response = trpc_client
                .query::<(), OrganizationsResponse>("organizationsList", None)
                .await?;
            let organizations = response.result.data;

            let index = Select::new().items(&organizations).default(0).interact()?;
            let organization = &organizations[index];

            let response = trpc_client
                .query::<(), FunctionsResponse>("functionsList", None)
                .await?;
            let functions = response.result.data;

            let index = Select::new().items(&functions).default(0).interact()?;
            let function = &functions[index];

            write_function_config(
                &file,
                DeploymentConfig {
                    function_id: function.id.clone(),
                    organization_id: organization.id.clone(),
                },
            )?;

            println!("{}", success("Function linked!"));
            println!();

            Ok(())
        }
        Some(_) => Err(anyhow!("This file is already linked to a Function.")),
    }
}
