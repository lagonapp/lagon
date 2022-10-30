use anyhow::{anyhow, Result};
use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Response as HyperResponse,
};
use std::{collections::HashMap, str::FromStr};

use crate::utils::{
    extract_v8_headers_object, extract_v8_integer, extract_v8_string, v8_headers_object, v8_string,
    v8_uint8array,
};
use crate::{
    http::{FromV8, IntoV8},
    utils::v8_integer,
};

static READABLE_STREAM_STR: &[u8] = b"[object ReadableStream]";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Response {
    pub headers: Option<HashMap<String, String>>,
    pub body: Bytes,
    pub status: u16,
}

impl Default for Response {
    fn default() -> Self {
        Response {
            headers: None,
            body: Bytes::new(),
            status: 200,
        }
    }
}

impl From<&str> for Response {
    fn from(body: &str) -> Self {
        Response {
            headers: None,
            body: Bytes::from(body.to_string()),
            status: 200,
        }
    }
}

impl IntoV8 for Response {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let response = v8::Object::new(scope);

        let body_key = v8_string(scope, "body");
        let body_value = v8_uint8array(scope, self.body.to_vec());
        response.set(scope, body_key.into(), body_value.into());

        let status_key = v8_string(scope, "status");
        let status_value = v8_integer(scope, self.status.into());
        response.set(scope, status_key.into(), status_value.into());

        let headers_key = v8_string(scope, "headers");

        if let Some(headers) = self.headers {
            let headers_value = v8_headers_object(scope, headers);
            response
                .set(scope, headers_key.into(), headers_value.into())
                .unwrap();
        }

        response
    }
}

impl FromV8 for Response {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        response: v8::Local<'a, v8::Value>,
    ) -> Result<Self> {
        let response = response.to_object(scope).unwrap();

        let body;
        let body_key = v8_string(scope, "body");

        if let Some(body_value) = response.get(scope, body_key.into()) {
            body = extract_v8_string(body_value, scope)?;
        } else {
            return Err(anyhow!("Could not find body"));
        }

        let mut headers = None;
        let headers_key = v8_string(scope, "headers");

        if let Some(headers_object) = response.get(scope, headers_key.into()) {
            if let Some(headers_object) = headers_object.to_object(scope) {
                if let Some(headers_value) = headers_object.get(scope, headers_key.into()) {
                    if !headers_value.is_null_or_undefined() {
                        headers = extract_v8_headers_object(headers_value, scope)?;
                    }
                } else {
                    return Err(anyhow!("Could not find headers object"));
                }
            } else {
                return Err(anyhow!("Could not find headers object"));
            }
        }

        let status;
        let status_key = v8_string(scope, "status");

        if let Some(status_value) = response.get(scope, status_key.into()) {
            status = extract_v8_integer(status_value, scope)? as u16;
        } else {
            return Err(anyhow!("Could not find status"));
        }

        Ok(Self {
            headers,
            body: Bytes::from(body),
            status,
        })
    }
}

impl From<&Response> for http::response::Builder {
    fn from(response: &Response) -> Self {
        let mut builder = HyperResponse::builder().status(response.status);

        let builder_headers = builder.headers_mut().unwrap();

        if let Some(headers) = &response.headers {
            for (key, value) in headers {
                builder_headers.insert(
                    HeaderName::from_str(key).unwrap(),
                    HeaderValue::from_str(value).unwrap(),
                );
            }
        }

        builder
    }
}

impl Response {
    // TODO: Return the full response length
    pub fn len(&self) -> usize {
        self.body.len()
    }

    pub fn is_streamed(&self) -> bool {
        self.body == READABLE_STREAM_STR
    }

    pub async fn from_hyper(response: HyperResponse<Body>) -> Self {
        let mut headers = HashMap::new();

        for (key, value) in response.headers().iter() {
            headers.insert(key.to_string(), value.to_str().unwrap().to_string());
        }

        let status = response.status().as_u16();

        let body = body::to_bytes(response.into_body()).await.unwrap();

        Response {
            status,
            headers: if !headers.is_empty() {
                Some(headers)
            } else {
                None
            },
            body,
        }
    }
}
