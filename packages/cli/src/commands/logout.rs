use std::io::{self, Error, ErrorKind};

use dialoguer::Confirm;

use crate::{
    auth::{get_token, rm_token},
    utils::{info, success},
};

pub fn logout() -> io::Result<()> {
    if (get_token()?).is_none() {
        return Err(Error::new(ErrorKind::Other, "You are not logged in."));
    }

    match Confirm::new()
        .with_prompt(info("Are you sure you want to log out?"))
        .interact()?
    {
        true => {
            rm_token()?;

            println!();
            println!("{}", success("You have been logged out."));

            Ok(())
        }
        false => Err(Error::new(ErrorKind::Other, "Logout aborted.")),
    }
}
