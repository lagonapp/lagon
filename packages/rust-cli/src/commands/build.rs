use std::{fs, io, path::PathBuf};

use crate::utils::{bundle_function, validate_code_file, validate_public_dir};

pub fn build(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
) -> io::Result<()> {
    validate_code_file(&file)?;

    let client = match client {
        Some(client) => {
            validate_code_file(&client)?;
            Some(client)
        }
        None => None,
    };

    let public_dir = validate_public_dir(public_dir)?;
    let (index, assets) = bundle_function(file, client, public_dir)?;

    println!();
    println!("Writting index.js...");

    fs::create_dir_all(".lagon")?;
    fs::write(".lagon/index.js", index)?;

    for (path, content) in assets {
        println!("Writting {}...", path);

        fs::create_dir_all(format!(".lagon/{}", path))?;
        fs::write(format!(".lagon/{}", path), content)?;
    }

    println!();
    println!("Build successful! You can find it in .lagon");
    println!();

    Ok(())
}
