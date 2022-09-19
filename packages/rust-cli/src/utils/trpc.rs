use serde::{de::DeserializeOwned, Deserialize, Serialize};

use super::get_site_url;

#[derive(Deserialize, Debug)]
pub struct TrpcResponse<T> {
    pub id: Option<String>,
    pub result: TrpcResult<T>,
}

#[derive(Deserialize, Debug)]
pub struct TrpcResult<T> {
    pub r#type: String,
    pub data: T,
}

pub struct TrpcClient<'a> {
    pub client: reqwest::blocking::Client,
    pub token: &'a str,
}

impl<'a> TrpcClient<'a> {
    pub fn new(token: &'a str) -> Self {
        Self {
            client: reqwest::blocking::Client::new(),
            token,
        }
    }

    pub fn query<T: Serialize, R: DeserializeOwned>(&self) -> Option<TrpcResponse<R>> {
        None
    }

    pub fn mutation<T: Serialize, R: DeserializeOwned>(
        &self,
        key: &str,
        request: T,
    ) -> Option<TrpcResponse<R>> {
        let request = serde_json::to_string(&request).unwrap();

        let response = self
            .client
            .post(get_site_url() + "/api/trpc/" + key)
            .body(request)
            .header("Content-Type", "application/json")
            .header("x-lagon-token", self.token)
            .send();

        if let Ok(response) = response {
            if let Ok(response) = response.json::<TrpcResponse<R>>() {
                return Some(response);
            }
        }

        None
    }
}
