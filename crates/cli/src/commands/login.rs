use crate::utils::{print_progress, Config, TrpcClient, THEME};
use anyhow::{anyhow, Result};
use colored::Colorize;
use dialoguer::{Confirm, Password};
use serde::{Deserialize, Serialize};

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
        && !Confirm::with_theme(&*THEME)
            .with_prompt("You are already logged in. Do you want to log out and log in again?")
            .default(true)
            .interact()?
    {
        println!();
        println!("{} Login aborted", "✕".red());
        return Ok(());
    }

    println!();

    let end_progress = print_progress("Opening browser");
    let url = config.site_url.clone() + "/cli";

    if webbrowser::open(&url).is_err() {
        println!("{} Could not open browser", "✕".red());
    }

    end_progress();
    println!(
        "{}",
        format!("   You can also manually access {}", url).bright_black()
    );
    println!();

    let code = Password::with_theme(&*THEME)
        .with_prompt("Paste the verification code from your browser here")
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
            println!(" {} You are now logged in!", "◼".magenta());
            println!("   {}", "You can now close the browser tab".black());

            Ok(())
        }
        Err(_) => Err(anyhow!("Failed to log in.")),
    }
}
