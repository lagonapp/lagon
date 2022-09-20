use std::{
    collections::HashMap,
    io::{self, Error, ErrorKind},
    path::PathBuf,
    process::Command,
};

fn esbuild(file: &PathBuf) -> io::Result<String> {
    let result = Command::new("esbuild")
        .arg(file)
        .arg("--bundle")
        .arg("--format=esm")
        .arg("--target=es2020")
        .arg("--platform=browser")
        .output()?;

    // TODO: check status code
    if result.status.success() {
        let output = result.stdout;

        return match String::from_utf8(output) {
            Ok(s) => Ok(s),
            Err(_) => Err(Error::new(
                ErrorKind::Other,
                "Failed to convert output to string",
            )),
        };
    }

    Err(Error::new(
        ErrorKind::Other,
        format!("Unexpected status code {}", result.status),
    ))
}

pub fn bundle_function(
    index: PathBuf,
    client: Option<PathBuf>,
    public_dir: PathBuf,
) -> io::Result<(String, HashMap<String, String>)> {
    if let Err(_) = Command::new("esbuild").arg("--version").output() {
        return Err(Error::new(
            ErrorKind::Other,
            "esbuild is not installed. Please install it with `npm install -g esbuild`",
        ));
    }

    let index_output = esbuild(&index)?;
    let mut assets = HashMap::<String, String>::new();

    if let Some(client) = client {
        let client_output = esbuild(&client)?;

        assets.insert(
            client.into_os_string().into_string().unwrap(),
            client_output,
        );
    }

    Ok((index_output, assets))
}
