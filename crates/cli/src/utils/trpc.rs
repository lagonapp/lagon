use super::Config;
use anyhow::{anyhow, Result};
use reqwest::{Client, ClientBuilder};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use urlencoding::encode;

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

pub struct TrpcClient {
    pub client: Client,
    config: Config,
}

impl TrpcClient {
    pub fn new(config: Config) -> Self {
        let client = ClientBuilder::new().use_rustls_tls().build().unwrap();

        Self { client, config }
    }

    pub async fn query<T, R>(&self, key: &str, body: Option<T>) -> Result<TrpcResponse<R>>
    where
        T: Serialize,
        R: DeserializeOwned,
    {
        let input = match body {
            Some(body) => format!("?input={}", encode(&serde_json::to_string(&body)?)),
            None => String::new(),
        };

        let response = self
            .client
            .request(
                "GET".parse()?,
                format!("{}/api/trpc/{}{}", self.config.site_url.clone(), key, input,),
            )
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .send()
            .await?;

        let body = response.text().await?;

        match serde_json::from_str::<TrpcResponse<R>>(&body) {
            Ok(response) => Ok(response),
            Err(_) => match serde_json::from_str::<TrpcErrorResult>(&body) {
                Ok(TrpcErrorResult { error }) => Err(anyhow!("Error from API: {}", error.message)),
                Err(_) => Err(anyhow!("Could not parse error from response: {}", body)),
            },
        }
    }

    pub async fn mutation<T, R>(&self, key: &str, body: T) -> Result<TrpcResponse<R>>
    where
        T: Serialize,
        R: DeserializeOwned,
    {
        let body = serde_json::to_string(&body)?;

        let response = self
            .client
            .request(
                "POST".parse()?,
                format!("{}/api/trpc/{}", self.config.site_url.clone(), key),
            )
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .body(body)
            .send()
            .await?;

        let body = response.text().await?;

        match serde_json::from_str::<TrpcResponse<R>>(&body) {
            Ok(response) => Ok(response),
            Err(_) => match serde_json::from_str::<TrpcErrorResult>(&body) {
                Ok(TrpcErrorResult { error }) => Err(anyhow!("Error from API: {}", error.message)),
                Err(_) => Err(anyhow!("Could not parse error from response: {}", body)),
            },
        }
    }
}
