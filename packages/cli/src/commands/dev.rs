use std::{io, path::PathBuf};

pub fn dev(
    _file: PathBuf,
    _client: Option<PathBuf>,
    _public_dir: Option<PathBuf>,
    _port: Option<u16>,
    _hostname: Option<String>,
) -> io::Result<()> {
    println!("dev");

    Ok(())
}
