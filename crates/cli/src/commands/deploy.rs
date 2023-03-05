use std::{
    fmt::{Display, Formatter},
    path::PathBuf,
};

use anyhow::{anyhow, Result};
use dialoguer::{Confirm, Input, Select};
use serde::{Deserialize, Serialize};

use crate::utils::{
    create_deployment, debug, get_root, info, print_progress, Config, FunctionConfig, TrpcClient,
};

#[derive(Deserialize, Debug)]
pub struct Organization {
    pub name: String,
    pub id: String,
}

impl Display for Organization {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

pub type OrganizationsResponse = Vec<Organization>;

#[derive(Serialize, Debug)]
struct CreateFunctionRequest {
    name: String,
    domains: Vec<String>,
    env: Vec<String>,
    cron: Option<String>,
}

#[derive(Deserialize, Debug)]
struct CreateFunctionResponse {
    id: String,
}

#[derive(Deserialize, Debug)]
pub struct Function {
    pub id: String,
    pub name: String,
}

impl Display for Function {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

pub type FunctionsResponse = Vec<Function>;

pub async fn deploy(
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    prod: bool,
    directory: Option<PathBuf>,
) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let root = get_root(directory);
    let mut function_config = FunctionConfig::load(&root, client, public_dir)?;

    if function_config.function_id.is_empty() {
        println!("{}", debug("No deployment config found..."));
        println!();

        let trpc_client = TrpcClient::new(config.clone());
        let response = trpc_client
            .query::<(), OrganizationsResponse>("organizationsList", None)
            .await?;
        let organizations = response.result.data;

        let index = Select::new()
            .items(&organizations)
            .default(0)
            .with_prompt(info("Select an Organization to deploy to"))
            .interact()?;
        let organization = &organizations[index];

        match Confirm::new()
            .with_prompt(info("Link to an existing Function?"))
            .interact()?
        {
            true => {
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

                function_config.function_id = function.id.clone();
                function_config.organization_id = organization.id.clone();
                function_config.write(&root)?;

                create_deployment(config, &function_config, prod, &root).await?;
            }
            false => {
                let name = Input::<String>::new()
                    .with_prompt(info("What is the name of this new Function?"))
                    .interact_text()?;

                println!();
                let message = format!("Creating Function {name}...");
                let end_progress = print_progress(&message);

                let response = trpc_client
                    .mutation::<CreateFunctionRequest, CreateFunctionResponse>(
                        "functionCreate",
                        CreateFunctionRequest {
                            name,
                            domains: Vec::new(),
                            env: Vec::new(),
                            cron: None,
                        },
                    )
                    .await?;
                let function = response.result.data;

                end_progress();

                function_config.function_id = function.id.clone();
                function_config.organization_id = organization.id.clone();
                function_config.write(&root)?;

                create_deployment(config, &function_config, prod, &root).await?;
            }
        }
    } else {
        create_deployment(config, &function_config, prod, &root).await?;
    }

    Ok(())
}
