use std::{collections::HashMap, env, fs, io, path::Path};

use hyper::body::Bytes;
use lagon_runtime::http::Response;

use super::Deployment;

pub fn handle_asset(deployment: &Deployment, asset: &String) -> io::Result<Response> {
    let path = Path::new(env::current_dir().unwrap().as_path())
        .join("deployments")
        .join(deployment.id.clone())
        .join(asset);
    let body = fs::read(path)?;

    let extension = Path::new(asset).extension().unwrap().to_str().unwrap();
    let content_type = match extension {
        "js" => "application/javascript",
        "css" => "text/css",
        "html" => "text/html",
        "png" => "image/png",
        "jpg" => "image/jpeg",
        "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "json" => "application/json",
        "txt" => "text/plain",
        _ => "text/plain",
    };

    let mut headers = HashMap::new();
    headers.insert("content-type".into(), content_type.into());

    Ok(Response {
        status: 200,
        headers: Some(headers),
        body: Bytes::from(body),
    })
}
