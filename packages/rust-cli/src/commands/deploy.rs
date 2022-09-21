use std::{io, path::PathBuf};

pub fn deploy(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    force: bool,
) -> io::Result<()> {
    println!("deploy");

    Ok(())
}
