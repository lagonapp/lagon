use std::io::{self, Error, ErrorKind};

use dialoguer::Confirm;

use crate::auth::{get_token, rm_token};

pub fn logout() -> io::Result<()> {
    if let None = get_token()? {
        return Err(Error::new(ErrorKind::Other, "You are not logged in."));
    }

    match Confirm::new()
        .with_prompt("Are you sure you want to log out?")
        .interact()?
    {
        true => {
            rm_token()?;

            println!();
            println!("You have been logged out.");

            Ok(())
        }
        false => Err(Error::new(ErrorKind::Other, "Logout aborted.")),
    }
}
