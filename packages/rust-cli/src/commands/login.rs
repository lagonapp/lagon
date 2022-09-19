use dialoguer::{Confirm, Input};

use crate::auth::{get_token, set_token};
use crate::utils::get_cli_url;

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

    if let Ok(code) = Input::<String>::new()
        .with_prompt("Verification code")
        .interact_text()
    {
        // TODO: Check code and get token back

        set_token("token".to_string());

        println!();
        println!("You can now close the browser tab.");
    }
}
