use std::io::{self, Error, ErrorKind};

use dialoguer::Confirm;

use crate::utils::{info, success, Config};

pub fn logout() -> io::Result<()> {
    let mut config = Config::new()?;

    if config.token.is_none() {
        return Err(Error::new(ErrorKind::Other, "You are not logged in."));
    }

    match Confirm::new()
        .with_prompt(info("Are you sure you want to log out?"))
        .interact()?
    {
        true => {
            config.set_token(None);
            config.save()?;

            println!();
            println!("{}", success("You have been logged out."));

            Ok(())
        }
        false => Err(Error::new(ErrorKind::Other, "Logout aborted.")),
    }
}
