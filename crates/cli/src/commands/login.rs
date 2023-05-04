use anyhow::{anyhow, Result};
use dialoguer::{Confirm, Password};
use serde::{Deserialize, Serialize};

use crate::utils::{debug, error, info, input, print_progress, success, Config, TrpcClient};

#[derive(Deserialize, Debug)]
struct CliResponse {
    token: String,
}

#[derive(Serialize, Debug)]
struct CliRequest {
    code: String,
}

pub async fn login() -> Result<()> {
    let mut config = Config::new()?;

    if config.token.is_some()
        && !Confirm::new()
            .with_prompt(info(
                "You are already logged in. Are you sure you want to log in again?",
            ))
            .interact()?
    {
        return Err(anyhow!("Login aborted."));
    }

    println!();

    let end_progress = print_progress("Opening browser...");
    let url = config.site_url.clone() + "/cli";

    if webbrowser::open(&url).is_err() {
        println!("{}", error("Couldn't open browser."));
    }

    end_progress();

    println!();
    println!(
        "{}",
        info(&format!("Please copy and paste the verification from your browser. You can also manually visit {}", url))
    );

    let code = Password::new()
        .with_prompt(input("Verification code"))
        .interact()?;

    config.set_token(Some(code.clone()));

    let client = TrpcClient::new(config.clone());
    let request = CliRequest { code };

    match client
        .mutation::<CliRequest, CliResponse>("tokensAuthenticate", request)
        .await
    {
        Ok(response) => {
            config.set_token(Some(response.result.data.token));
            config.save()?;

            println!();
            println!(
                "{} {}",
                success("You are now logged in."),
                debug("You can close your browser tab.")
            );

            Ok(())
        }
        Err(_) => Err(anyhow!("Failed to log in.")),
    }
}
