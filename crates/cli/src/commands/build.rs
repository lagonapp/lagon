use crate::utils::{bundle_function, print_progress, resolve_path};
use anyhow::{anyhow, Result};
use dialoguer::console::style;
use std::{fs, path::PathBuf};

pub fn build(
    path: Option<PathBuf>,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
) -> Result<()> {
    let (root, function_config) = resolve_path(path, client, public_dir)?;
    let (index, assets) = bundle_function(&function_config, &root, true)?;

    let end_progress = print_progress("Writting files");
    let root = root.join(".lagon");

    fs::create_dir_all(&root)?;
    fs::write(root.join("index.js"), index)?;

    for (path, content) in assets {
        let dir = root.join("public").join(
            PathBuf::from(&path)
                .parent()
                .ok_or_else(|| anyhow!("Could not find parent of {}", path))?,
        );
        fs::create_dir_all(dir)?;
        fs::write(root.join("public").join(path), content)?;
    }

    end_progress();

    println!();
    println!(" {} Build successful!", style("◼").magenta());
    println!(
        "   {}",
        style(format!("You can find it in {:?}", root)).black().bright()
    );

    Ok(())
}
