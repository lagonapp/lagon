use std::path::PathBuf;

use crate::utils::{
    bundle_function, validate_client_file, validate_index_file, validate_public_dir,
};

pub fn build(file: PathBuf, client: Option<PathBuf>, public_dir: Option<PathBuf>) {
    if !validate_index_file(&file) {
        return;
    }

    let client = validate_client_file(client);
    let public_dir = validate_public_dir(public_dir);

    if public_dir.is_none() {
        return;
    }

    let public_dir = public_dir.unwrap();

    bundle_function(file, client, public_dir);
}
