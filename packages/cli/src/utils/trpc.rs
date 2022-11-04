use anyhow::{anyhow, Result};
use hyper::{body, client::HttpConnector, Body, Client, Method, Request};
use hyper_tls::HttpsConnector;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use super::Config;

#[derive(Deserialize, Debug)]
pub struct TrpcResponse<T> {
    pub result: TrpcResult<T>,
}

#[derive(Deserialize, Debug)]
pub struct TrpcResult<T> {
    pub data: T,
}

#[derive(Deserialize)]
pub struct TrpcError {
    message: String,
}

#[derive(Deserialize)]
pub struct TrpcErrorResult {
    error: TrpcError,
}

pub struct TrpcClient<'a> {
    pub client: Client<HttpsConnector<HttpConnector>>,
    config: &'a Config,
}

impl<'a> TrpcClient<'a> {
    pub fn new(config: &'a Config) -> Self {
        let client = Client::builder().build::<_, Body>(HttpsConnector::new());

        Self { client, config }
    }

    pub async fn query<T: Serialize, R: DeserializeOwned>(
        &self,
        key: &str,
        body: Option<T>,
    ) -> Result<TrpcResponse<R>> {
        let body = match body {
            Some(body) => Body::from(serde_json::to_string(&body)?),
            None => Body::empty(),
        };

        let request = Request::builder()
            .method(Method::GET)
            .uri(self.config.site_url.clone() + "/api/trpc/" + key)
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .body(body)?;

        let response = self.client.request(request).await?;
        let body = body::to_bytes(response.into_body()).await?;
        let body = String::from_utf8(body.to_vec())?;

        match serde_json::from_str::<TrpcResponse<R>>(&body) {
            Ok(response) => Ok(response),
            Err(_) => match serde_json::from_str::<TrpcErrorResult>(&body) {
                Ok(TrpcErrorResult { error }) => Err(anyhow!("Error from API: {}", error.message)),
                Err(_) => Err(anyhow!("Could not parse error from response: {}", body)),
            },
        }
    }

    pub async fn mutation<T: Serialize, R: DeserializeOwned>(
        &self,
        key: &str,
        body: T,
    ) -> Result<TrpcResponse<R>> {
        let body = serde_json::to_string(&body)?;

        let request = Request::builder()
            .method(Method::POST)
            .uri(self.config.site_url.clone() + "/api/trpc/" + key)
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .body(Body::from(body))?;

        let response = self.client.request(request).await?;
        let body = body::to_bytes(response.into_body()).await?;
        let body = String::from_utf8(body.to_vec())?;

        match serde_json::from_str::<TrpcResponse<R>>(&body) {
            Ok(response) => Ok(response),
            Err(_) => match serde_json::from_str::<TrpcErrorResult>(&body) {
                Ok(TrpcErrorResult { error }) => Err(anyhow!("Error from API: {}", error.message)),
                Err(_) => Err(anyhow!("Could not parse error from response: {}", body)),
            },
        }
    }
}
