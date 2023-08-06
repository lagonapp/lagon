use crate::utils::{
    create_deployment, get_theme, print_progress, resolve_path, Config, TrpcClient,
};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Confirm, Input, Select};
use serde::{Deserialize, Serialize};
use std::{
    fmt::{Display, Formatter},
    path::PathBuf,
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
    platform: String,
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
    path: Option<PathBuf>,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    is_production: bool,
) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please log in with `lagon login`",
        ));
    }

    let (root, mut function_config) = resolve_path(path, client, public_dir)?;

    if function_config.function_id.is_empty() {
        println!(
            "{}",
            style("No previous Deployment found...").black().bright()
        );
        println!();

        let mut trpc_client = TrpcClient::new(config.clone());
        trpc_client.set_organization_id(function_config.organization_id.clone());

        let response = trpc_client
            .query::<(), OrganizationsResponse>("organizationsList", None)
            .await?;
        let organizations = response.result.data;

        let index = Select::with_theme(get_theme())
            .items(&organizations)
            .default(0)
            .with_prompt("Which Organization would you like to deploy to?")
            .interact()?;
        let organization = &organizations[index];

        match Confirm::with_theme(get_theme())
            .with_prompt("Link to an existing Function?")
            .default(false)
            .interact()?
        {
            true => {
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

                function_config.function_id = function.id.clone();
                function_config.organization_id = organization.id.clone();
                function_config.write(&root)?;

                println!();
                create_deployment(config, &function_config, is_production, &root, true).await?;
            }
            false => {
                let name = Input::<String>::with_theme(get_theme())
                    .with_prompt("What's the name of this new Function?")
                    .interact_text()?;

                println!();
                let message = format!("Creating Function {name}");
                let end_progress = print_progress(&message);

                let response = trpc_client
                    .mutation::<CreateFunctionRequest, CreateFunctionResponse>(
                        "functionCreate",
                        CreateFunctionRequest {
                            name,
                            domains: Vec::new(),
                            env: Vec::new(),
                            cron: None,
                            platform: "CLI".into(),
                        },
                    )
                    .await?;
                let function = response.result.data;

                end_progress();

                function_config.function_id = function.id.clone();
                function_config.organization_id = organization.id.clone();
                function_config.write(&root)?;

                create_deployment(config, &function_config, is_production, &root, true).await?;
            }
        }
    } else {
        create_deployment(config, &function_config, is_production, &root, true).await?;
    }

    Ok(())
}
