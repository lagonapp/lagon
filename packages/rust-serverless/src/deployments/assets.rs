use lagon_runtime::http::Response;

use super::Deployment;

pub fn handle_asset(deployment: &Deployment, asset: &String) -> Response {
    // TODO: read asset from file
    Response {
        status: 200,
        headers: None,
        body: asset.into(),
    }
}
