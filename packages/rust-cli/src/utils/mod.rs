mod deployments;
mod trpc;

use std::path::PathBuf;

pub use deployments::*;
pub use trpc::*;

#[cfg(debug_assertions)]
pub fn get_site_url() -> String {
    "http://localhost:3000".to_string()
}

#[cfg(not(debug_assertions))]
pub fn get_site_url() -> String {
    "https://dash.lagon.app".to_string()
}

pub fn get_cli_url() -> String {
    get_site_url() + "/cli"
}

pub fn validate_index_file(file: &PathBuf) -> bool {
    match file.extension() {
        Some(ext) => {
            let validate = ext == "js"
                || ext == "jsx"
                || ext == "ts"
                || ext == "tsx"
                || ext == "mjs"
                || ext == "cjs";

            if !validate {
                println!("Extension {} is not supported (should be one of .js, .jsx, .ts, .tsx, .mjs, .cjs)", ext.to_str().unwrap());
            }

            validate
        }
        None => {
            println!("No extension found for the given file.");
            false
        }
    }
}

pub fn validate_client_file(file: Option<PathBuf>) -> Option<PathBuf> {
    match file {
        Some(file) => match file.extension() {
            Some(ext) => {
                let validate = ext == "js"
                    || ext == "jsx"
                    || ext == "ts"
                    || ext == "tsx"
                    || ext == "mjs"
                    || ext == "cjs";

                if !validate {
                    println!("Extension {} is not supported (should be one of .js, .jsx, .ts, .tsx, .mjs, .cjs)", ext.to_str().unwrap());
                    return None;
                }

                Some(file)
            }
            None => {
                println!("No extension found for the given file.");
                None
            }
        },
        None => None,
    }
}

pub fn validate_public_dir(public_dir: Option<PathBuf>) -> Option<PathBuf> {
    if let Some(dir) = public_dir {
        if !dir.is_dir() {
            println!("Public directory {} does not exist.", dir.to_str().unwrap());
            return None;
        }

        return Some(dir);
    }

    Some(PathBuf::from("./public"))
}
