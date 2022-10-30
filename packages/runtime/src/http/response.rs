use anyhow::Result;
use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Response as HyperResponse,
};
use std::{collections::HashMap, str::FromStr};

use crate::utils::{extract_v8_string, v8_headers_object, v8_string, v8_uint8array};
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

        let body_key = v8_string(scope, "body");
        let body = response.get(scope, body_key.into()).unwrap();
        let body = extract_v8_string(body, scope)?;

        let headers_key = v8_string(scope, "headers");
        let headers_object = response
            .get(scope, headers_key.into())
            .unwrap()
            .to_object(scope)
            .unwrap();
        let headers_map = headers_object.get(scope, headers_key.into()).unwrap();
        let headers_map = unsafe { v8::Local::<v8::Map>::cast(headers_map) };

        let mut headers = None;

        if headers_map.size() > 0 {
            let mut final_headers = HashMap::new();

            let headers_keys = headers_map.as_array(scope);

            for mut index in 0..headers_keys.length() {
                if index % 2 != 0 {
                    continue;
                }

                let key = headers_keys
                    .get_index(scope, index)
                    .unwrap()
                    .to_rust_string_lossy(scope);
                index += 1;
                let value = headers_keys
                    .get_index(scope, index)
                    .unwrap()
                    .to_rust_string_lossy(scope);

                final_headers.insert(key, value);
            }

            headers = Some(final_headers);
        }

        let status_key = v8_string(scope, "status");
        let status = response
            .get(scope, status_key.into())
            .unwrap()
            .integer_value(scope)
            .unwrap() as u16;

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
