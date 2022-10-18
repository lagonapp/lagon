use std::io::{self, Error, ErrorKind};

use dialoguer::{Confirm, Password};
use serde::{Deserialize, Serialize};

use crate::utils::{debug, get_site_url, info, input, print_progress, success, Config, TrpcClient};

#[derive(Deserialize, Debug)]
struct CliResponse {
    token: String,
}

#[derive(Serialize, Debug)]
struct CliRequest {
    code: String,
}

pub async fn login() -> io::Result<()> {
    let mut config = Config::new()?;

    if config.token.is_some()
        && !Confirm::new()
            .with_prompt(info(
                "You are already logged in. Are you sure you want to log in again?",
            ))
            .interact()?
    {
        return Err(Error::new(ErrorKind::Other, "Login aborted."));
    }

    println!();

    let end_progress = print_progress("Opening browser...");
    let url = get_site_url() + "/cli";
    webbrowser::open(&url).unwrap();
    end_progress();

    println!();
    println!(
        "{}",
        info("Please copy and paste the verification from your browser.")
    );

    let code = Password::new()
        .with_prompt(input("Verification code"))
        .interact()?;

    config.set_token(Some(code.clone()));

    let client = TrpcClient::new(&config);
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
        Err(_) => Err(Error::new(ErrorKind::Other, "Failed to log in.")),
    }
}
