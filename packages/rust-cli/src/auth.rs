use std::fs;

// TODO: Handle errors

pub fn get_token() -> Option<String> {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if !path.exists() {
        return None;
    }

    match fs::read_to_string(path) {
        Ok(content) => Some(content),
        Err(_) => None,
    }
}

pub fn set_token(token: String) {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if !path.exists() {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
    }

    fs::write(path, token).unwrap();
}

pub fn rm_token() {
    let path = dirs::home_dir().unwrap().join(".lagon").join("config");

    if path.exists() {
        fs::remove_file(path).unwrap();
    }
}
