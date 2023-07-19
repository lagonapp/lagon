use crate::{
    commands::deploy::{FunctionsResponse, OrganizationsResponse},
    utils::{get_root, get_theme, Config, FunctionConfig, TrpcClient},
};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Select};
use std::path::PathBuf;

pub async fn link(directory: Option<PathBuf>) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let function_config = FunctionConfig::load(&root, None, None)?;

    match !function_config.function_id.is_empty() {
        true => Err(anyhow!("This directory is already linked to a Function")),
        false => {
            let mut trpc_client = TrpcClient::new(config);
            trpc_client.set_organization_id(function_config.organization_id.clone());

            let response = trpc_client
                .query::<(), OrganizationsResponse>("organizationsList", None)
                .await?;
            let organizations = response.result.data;

            let index = Select::with_theme(get_theme())
                .items(&organizations)
                .default(0)
                .with_prompt("Which Organization would you like to link from?")
                .interact()?;
            let organization = &organizations[index];

            let response = trpc_client
                .query::<(), FunctionsResponse>("functionsList", None)
                .await?;
            let functions = response.result.data;

            let index = Select::with_theme(get_theme())
                .items(&functions)
                .default(0)
                .with_prompt("Which Function would you like to link?")
                .interact()?;
            let function = &functions[index];

            let mut function_config = FunctionConfig::load(&root, None, None)?;
            function_config.function_id = function.id.clone();
            function_config.organization_id = organization.id.clone();
            function_config.write(&root)?;

            println!();
            println!(" {} Function linked!", style("◼").magenta());

            Ok(())
        }
    }
}
