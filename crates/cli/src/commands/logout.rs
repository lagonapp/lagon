use crate::utils::{Config, THEME};
use anyhow::{anyhow, Result};
use dialoguer::{console::style, Confirm};

pub fn logout() -> Result<()> {
    let mut config = Config::new()?;

    if config.token.is_none() {
        return Err(anyhow!("You are not logged in."));
    }

    match Confirm::with_theme(&*THEME)
        .with_prompt("Do you really want to log out?")
        .default(true)
        .interact()?
    {
        true => {
            config.set_token(None);
            config.save()?;

            println!();
            println!(" {} You have been logged out!", style("◼").magenta());

            Ok(())
        }
        false => {
            println!();
            println!("{} Logout aborted", style("✕").red());
            Ok(())
        }
    }
}
