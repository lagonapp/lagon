use std::{
    fmt::{Display, Formatter},
    io::{self, Error, ErrorKind},
    path::PathBuf,
};

use dialoguer::{Confirm, Input, Select};
use serde::{Deserialize, Serialize};

use crate::utils::{
    create_deployment, debug, get_function_config, info, print_progress, validate_code_file,
    validate_public_dir, write_function_config, Config, DeploymentConfig, TrpcClient,
};

#[derive(Deserialize, Debug)]
struct Organization {
    name: String,
    id: String,
}

impl Display for Organization {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

type OrganizationsResponse = Vec<Organization>;

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
struct Function {
    id: String,
    name: String,
}

impl Display for Function {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}

type FunctionsResponse = Vec<Function>;

pub async fn deploy(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    _force: bool,
) -> io::Result<()> {
    let config = Config::new()?;

    if config.token.is_none() {
        return Err(Error::new(
            ErrorKind::Other,
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
    let function_config = get_function_config()?;

    if function_config.is_none() {
        println!("{}", debug("No deployment config found..."));
        println!();

        let trpc_client = TrpcClient::new(&config);
        let response = trpc_client
            .query::<(), OrganizationsResponse>("organizationsList", None)
            .await
            .unwrap();
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
                    .await
                    .unwrap();

                let index = Select::new()
                    .items(&response.result.data)
                    .default(0)
                    .interact()?;
                let function = &response.result.data[index];

                write_function_config(DeploymentConfig {
                    function_id: function.id.clone(),
                    organization_id: organization.id.clone(),
                })?;

                create_deployment(function.id.clone(), &file, &client, &public_dir, &config)
                    .await?;
            }
            false => {
                let name = Input::<String>::new()
                    .with_prompt(info("What is the name of this new Function?"))
                    .interact_text()?;

                println!();
                let message = format!("Creating Function {}...", name);
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
                    .await
                    .unwrap();

                end_progress();

                write_function_config(DeploymentConfig {
                    function_id: response.result.data.id.clone(),
                    organization_id: organization.id.clone(),
                })?;

                create_deployment(
                    response.result.data.id,
                    &file,
                    &client,
                    &public_dir,
                    &config,
                )
                .await?;
            }
        };

        return Ok(());
    }

    let function_config = function_config.unwrap();

    create_deployment(
        function_config.function_id,
        &file,
        &client,
        &public_dir,
        &config,
    )
    .await
}
