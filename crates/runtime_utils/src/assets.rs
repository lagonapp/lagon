use anyhow::Result;
use hyper::body::Bytes;
use lagon_runtime_http::Response;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
};

pub fn find_asset(mut url: String, assets: &'_ HashSet<String>) -> Option<&'_ String> {
    // Remove the leading '/' from the url
    url.remove(0);

    assets.iter().find(|asset| {
        **asset == url
            || asset.replace(".html", "") == url
            || asset.replace("/index.html", "") == url
            || asset.replace("index.html", "") == url
    })
}

pub fn handle_asset(root: PathBuf, asset: &String) -> Result<Response> {
    let path = root.join(asset);
    let body = fs::read(path)?;

    let content_type = Path::new(asset).extension().map_or(
        "application/octet-stream",
        |extension| match extension.to_str().unwrap_or("") {
            "js" => "application/javascript",
            "css" => "text/css",
            "html" => "text/html",
            "png" => "image/png",
            "jpg" => "image/jpeg",
            "jpeg" => "image/jpeg",
            "svg" => "image/svg+xml",
            "json" => "application/json",
            "txt" => "text/plain",
            _ => "application/octet-stream",
        },
    );

    let mut headers = HashMap::with_capacity(1);
    headers.insert("content-type".into(), vec![content_type.into()]);

    Ok(Response {
        status: 200,
        headers: Some(headers),
        body: Bytes::from(body),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn find_asset_literal() {
        let assets = vec![
            "index.html".into(),
            "about.html".into(),
            "hello/index.html".into(),
            "hello/world.html".into(),
        ]
        .into_iter()
        .collect::<HashSet<String>>();

        assert_eq!(find_asset("/".into(), &assets), Some(&"index.html".into()));
        assert_eq!(
            find_asset("/about".into(), &assets),
            Some(&"about.html".into())
        );
        assert_eq!(
            find_asset("/hello".into(), &assets),
            Some(&"hello/index.html".into())
        );
        assert_eq!(
            find_asset("/hello/world".into(), &assets),
            Some(&"hello/world.html".into())
        );
    }

    #[test]
    fn find_asset_extension() {
        let assets = vec![
            "index.html".into(),
            "about.html".into(),
            "hello/index.html".into(),
            "hello/world.html".into(),
        ]
        .into_iter()
        .collect::<HashSet<String>>();

        assert_eq!(
            find_asset("/index.html".into(), &assets),
            Some(&"index.html".into())
        );
        assert_eq!(
            find_asset("/about.html".into(), &assets),
            Some(&"about.html".into())
        );
        assert_eq!(
            find_asset("/hello/index.html".into(), &assets),
            Some(&"hello/index.html".into())
        );
        assert_eq!(
            find_asset("/hello/world.html".into(), &assets),
            Some(&"hello/world.html".into())
        );
    }

    #[test]
    fn find_asset_none() {
        let assets = vec![
            "about.html".into(),
            "hello/index.html".into(),
            "hello/world.html".into(),
        ]
        .into_iter()
        .collect::<HashSet<String>>();

        assert_eq!(find_asset("/".into(), &assets), None);
        assert_eq!(find_asset("/index".into(), &assets), None);
        assert_eq!(find_asset("/index.html".into(), &assets), None);
        assert_eq!(find_asset("/about2".into(), &assets), None);
        assert_eq!(find_asset("/hello/none".into(), &assets), None);
        assert_eq!(find_asset("/hello/world/none".into(), &assets), None);
    }
}
