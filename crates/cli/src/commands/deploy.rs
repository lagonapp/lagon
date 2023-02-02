use std::{
    fmt::{Display, Formatter},
    path::PathBuf,
};

use anyhow::{anyhow, Result};
use dialoguer::{Confirm, Input, Select};
use serde::{Deserialize, Serialize};

use crate::utils::{
    create_deployment, debug, get_function_config, info, print_progress, validate_code_file,
    validate_public_dir, write_function_config, Config, DeploymentConfig, TrpcClient,
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
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    prod: bool,
) -> Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!(
            "You are not logged in. Please login with `lagon login`",
        ));
    }

    validate_code_file(&file)?;

    let client = match client {
        Some(client) => {
            validate_code_file(&client)?;
            Some(client)
        }
        None => None,
    };

    let public_dir = validate_public_dir(public_dir)?;
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

            match Confirm::new()
                .with_prompt(info("Link to an existing Function?"))
                .interact()?
            {
                true => {
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

                    create_deployment(
                        function.id.clone(),
                        &file,
                        &client,
                        &public_dir,
                        &config,
                        prod,
                    )
                    .await?;
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

                    write_function_config(
                        &file,
                        DeploymentConfig {
                            function_id: function.id.clone(),
                            organization_id: organization.id.clone(),
                        },
                    )?;

                    create_deployment(function.id, &file, &client, &public_dir, &config, prod)
                        .await?;
                }
            };

            Ok(())
        }
        Some(function_config) => {
            create_deployment(
                function_config.function_id,
                &file,
                &client,
                &public_dir,
                &config,
                prod,
            )
            .await
        }
    }
}
