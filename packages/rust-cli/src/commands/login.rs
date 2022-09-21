use std::io::{self, Error, ErrorKind};

use dialoguer::{Confirm, Input};
use serde::{Deserialize, Serialize};

use crate::auth::{get_token, set_token};
use crate::utils::{get_cli_url, TrpcClient};

#[derive(Deserialize, Debug)]
struct CliResponse {
    token: String,
}

#[derive(Serialize, Debug)]
struct CliRequest {
    code: String,
}

pub fn login() -> io::Result<()> {
    if let Some(_) = get_token()? {
        if !Confirm::new()
            .with_prompt("You are already logged in. Are you sure you want to log in again?")
            .interact()?
        {
            return Err(Error::new(ErrorKind::Other, "Login aborted."));
        }
    }

    println!();
    println!("Opening browser...");

    webbrowser::open(&get_cli_url()).unwrap();

    println!("Please copy and paste the verification code from the browser.");
    println!();

    let code = Input::<String>::new()
        .with_prompt("Verification code")
        .interact_text()?;

    let client = TrpcClient::new(&code);
    let request = CliRequest { code: code.clone() };

    match client.mutation::<CliRequest, CliResponse>("tokens.authenticate", request) {
        Some(response) => {
            set_token(response.result.data.token)?;

            println!();
            println!("You can now close the browser tab.");

            Ok(())
        }
        None => Err(Error::new(ErrorKind::Other, "Failed to log in.")),
    }
}
