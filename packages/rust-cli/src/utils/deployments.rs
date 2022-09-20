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
        .output();

    if let Err(e) = result {
        return Err(Error::new(
            ErrorKind::Other,
            format!("Failed to bundle function: {}", e),
        ));
    }

    // TODO: check status code
    let output = result.unwrap().stdout;

    match String::from_utf8(output) {
        Ok(s) => Ok(s),
        Err(_) => Err(Error::new(
            ErrorKind::Other,
            "Failed to convert output to string",
        )),
    }
}

pub fn bundle_function(
    index: PathBuf,
    client: Option<PathBuf>,
    public_dir: PathBuf,
) -> Option<(String, HashMap<String, String>)> {
    if let Err(_) = Command::new("esbuild").arg("--version").output() {
        println!("esbuild is not installed. Please install it with `npm install -g esbuild`");
        return None;
    }

    let index_output = esbuild(&index);

    if let Err(e) = index_output {
        println!("{}", e);
        return None;
    }

    let index_output = index_output.unwrap();
    let mut assets = HashMap::<String, String>::new();

    if let Some(client) = client {
        let client_output = esbuild(&client);

        if let Err(e) = client_output {
            println!("{}", e);
            return None;
        }

        assets.insert(
            client.into_os_string().into_string().unwrap(),
            client_output.unwrap(),
        );
    }

    Some((index_output, assets))
}
