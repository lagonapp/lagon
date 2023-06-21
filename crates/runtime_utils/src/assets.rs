use anyhow::Result;
use hyper::{body::Bytes, header::CONTENT_TYPE, http::response::Builder, Body, Response};
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

pub fn find_asset<'a>(url: &'a str, assets: &'a HashSet<String>) -> Option<&'a str> {
    // Fast path to return early if there are no assets
    if assets.len() == 0 {
        return None;
    }

    // Remove the leading '/' from the url
    let url = &url[1..];

    assets
        .iter()
        .find(|asset| {
            **asset == url
                || asset.replace(".html", "") == url
                || asset.replace("/index.html", "") == url
                || asset.replace("index.html", "") == url
        })
        .map(|asset| asset.as_str())
}

pub fn handle_asset(root: PathBuf, asset: &str) -> Result<(Builder, Body)> {
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

    Ok((
        Response::builder().header(CONTENT_TYPE, content_type),
        Body::from(Bytes::from(body)),
    ))
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

        assert_eq!(find_asset("/", &assets), Some("index.html"));
        assert_eq!(find_asset("/about", &assets), Some("about.html"));
        assert_eq!(find_asset("/hello", &assets), Some("hello/index.html"));
        assert_eq!(
            find_asset("/hello/world", &assets),
            Some("hello/world.html")
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

        assert_eq!(find_asset("/index.html", &assets), Some("index.html"));
        assert_eq!(find_asset("/about.html", &assets), Some("about.html"));
        assert_eq!(
            find_asset("/hello/index.html", &assets),
            Some("hello/index.html")
        );
        assert_eq!(
            find_asset("/hello/world.html", &assets),
            Some("hello/world.html")
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

        assert_eq!(find_asset("/", &assets), None);
        assert_eq!(find_asset("/index", &assets), None);
        assert_eq!(find_asset("/index.html", &assets), None);
        assert_eq!(find_asset("/about2", &assets), None);
        assert_eq!(find_asset("/hello/none", &assets), None);
        assert_eq!(find_asset("/hello/world/none", &assets), None);
    }
}
