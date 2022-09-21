use std::{
    io::{self, Error, ErrorKind},
    path::PathBuf,
};

use crate::{
    auth::get_token,
    utils::{create_deployment, get_function_config, validate_code_file, validate_public_dir},
};

pub fn deploy(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    force: bool,
) -> io::Result<()> {
    let token = get_token()?;

    if token.is_none() {
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
    let config = get_function_config()?;

    // if config.is_none() {
    //     println!("No deployment config found...");
    //     println!();

    //     return Ok(());
    // }

    // let config = config.unwrap();

    // create_deployment(config.function_id, file, client, public_dir, token.unwrap())
    create_deployment(
        String::from("funcid"),
        file,
        client,
        public_dir,
        token.unwrap(),
    )
}
