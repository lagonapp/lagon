use std::{fs, io};

pub fn get_token() -> io::Result<Option<String>> {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if !path.exists() {
        return Ok(None);
    }

    match fs::read_to_string(path) {
        Ok(content) => Ok(Some(content)),
        Err(error) => Err(error),
    }
}

pub fn set_token(token: String) -> io::Result<()> {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if !path.exists() {
        fs::create_dir_all(path.parent().unwrap())?;
    }

    fs::write(path, token)?;

    Ok(())
}

pub fn rm_token() -> io::Result<()> {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if path.exists() {
        fs::remove_file(path)?;
    }

    Ok(())
}
