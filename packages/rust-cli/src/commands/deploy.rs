use std::{io, path::PathBuf};

use crate::utils::{get_function_config, validate_code_file, validate_public_dir, create_deployment};

pub fn deploy(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    force: bool,
) -> io::Result<()> {
    validate_code_file(&file)?;

    let client = match client {
        Some(client) => {
            validate_code_file(&client)?;
            Some(client)
        }
        None => None,
    };

    let public_dir = validate_public_dir(public_dir)?;
    let config = get_function_config()?;

    if config.is_none() {
        println!("No deployment config found...");
        println!();

        return Ok(());
    }

    let config = config.unwrap();

    create_deployment(config.function_id, file, client, public_dir)
}
