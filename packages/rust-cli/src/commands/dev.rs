use std::{io, path::PathBuf};

pub fn dev(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    port: Option<u16>,
    hostname: Option<String>,
) -> io::Result<()> {
    println!("dev");

    Ok(())
}
