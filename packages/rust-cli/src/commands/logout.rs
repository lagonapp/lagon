use dialoguer::Confirm;

use crate::auth::{get_token, rm_token};

pub fn logout() {
    if let None = get_token() {
        println!("You are not logged in.");
        return;
    }

    if let Ok(log_out) = Confirm::new()
        .with_prompt("Are you sure you want to log out?")
        .interact()
    {
        match log_out {
            true => {
                rm_token();

                println!();
                println!("You have been logged out.");
            }
            false => {
                println!("Logout aborted.");
            }
        }
    }
}
