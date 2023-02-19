use std::path::PathBuf;

use anyhow::{anyhow, Result};

use dialoguer::Select;

use crate::{
    commands::deploy::{FunctionsResponse, OrganizationsResponse},
    utils::{get_root, info, success, Config, FunctionConfig, TrpcClient},
};

pub async fn link(directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);

    match root.join(".lagon").join("config.json").exists() {
        true => Err(anyhow!("This directory is already linked to a Function.")),
        false => {
            let trpc_client = TrpcClient::new(&config);
            let response = trpc_client
                .query::<(), OrganizationsResponse>("organizationsList", None)
                .await?;
            let organizations = response.result.data;

            let index = Select::new()
                .items(&organizations)
                .default(0)
                .with_prompt(info("Select an Organization to link from"))
                .interact()?;
            let organization = &organizations[index];

            let response = trpc_client
                .query::<(), FunctionsResponse>("functionsList", None)
                .await?;
            let functions = response.result.data;

            let index = Select::new()
                .items(&functions)
                .default(0)
                .with_prompt(info("Select a Function to link from"))
                .interact()?;
            let function = &functions[index];

            let mut function_config = FunctionConfig::load(&root, None, None)?;
            function_config.function_id = function.id.clone();
            function_config.organization_id = organization.id.clone();
            function_config.write(&root)?;

            println!("{}", success("Function linked!"));

            Ok(())
        }
    }
}
