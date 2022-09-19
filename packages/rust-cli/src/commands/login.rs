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

pub fn login() {
    if let Some(_) = get_token() {
        if let Ok(log_in_again) = Confirm::new()
            .with_prompt("You are already logged in. Are you sure you want to log in again?")
            .interact()
        {
            if !log_in_again {
                println!("Login aborted.");
                return;
            }
        }
    }

    println!();
    println!("Opening browser...");

    webbrowser::open(&get_cli_url()).unwrap();

    println!("Please copy and paste the verification code from the browser.");
    println!();

    if let Ok(ref code) = Input::<String>::new()
        .with_prompt("Verification code")
        .interact_text()
    {
        let client = TrpcClient::new(code);
        let request = CliRequest {
            code: code.to_string(),
        };

        match client.mutation::<CliRequest, CliResponse>("tokens.authenticate", request) {
            Some(response) => {
                set_token(response.result.data.token);

                println!();
                println!("You can now close the browser tab.");
            }
            None => println!("Failed to log in."),
        };
    }
}
