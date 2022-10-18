use hyper::{body, client::HttpConnector, http::Result, Body, Client, Method, Request};
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
            Some(body) => Body::from(serde_json::to_string(&body).unwrap()),
            None => Body::empty(),
        };

        let request = Request::builder()
            .method(Method::GET)
            .uri(self.config.site_url.clone() + "/api/trpc/" + key)
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .body(body)?;

        let response = self.client.request(request).await.unwrap();
        let body = body::to_bytes(response.into_body()).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        let response = serde_json::from_str::<TrpcResponse<R>>(&body).unwrap();

        Ok(response)
    }

    pub async fn mutation<T: Serialize, R: DeserializeOwned>(
        &self,
        key: &str,
        body: T,
    ) -> Result<TrpcResponse<R>> {
        let body = serde_json::to_string(&body).unwrap();

        let request = Request::builder()
            .method(Method::POST)
            .uri(self.config.site_url.clone() + "/api/trpc/" + key)
            .header("content-type", "application/json")
            .header("x-lagon-token", self.config.token.as_ref().unwrap())
            .body(Body::from(body))?;

        let response = self.client.request(request).await.unwrap();
        let body = body::to_bytes(response.into_body()).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        let response = serde_json::from_str::<TrpcResponse<R>>(&body).unwrap();

        Ok(response)
    }
}
