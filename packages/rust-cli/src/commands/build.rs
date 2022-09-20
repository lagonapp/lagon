use std::{fs, io, path::PathBuf};

use crate::utils::{
    bundle_function, validate_client_file, validate_index_file, validate_public_dir,
};

pub fn build(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
) -> io::Result<()> {
    validate_index_file(&file)?;

    let client = match client {
        Some(client) => Some(validate_client_file(client)?),
        None => None,
    };

    let public_dir = validate_public_dir(public_dir)?;
    let (index, assets) = bundle_function(file, client, public_dir)?;

    println!();
    println!("Writting index.js...");

    fs::create_dir_all(".lagon").unwrap();
    fs::write(".lagon/index.js", index).unwrap();

    for (path, content) in assets {
        println!("Writting {}...", path);

        fs::create_dir_all(format!(".lagon/{}", path)).unwrap();
        fs::write(format!(".lagon/{}", path), content).unwrap();
    }

    println!();
    println!("Build successful! You can find it in .lagon");
    println!();

    Ok(())
}
