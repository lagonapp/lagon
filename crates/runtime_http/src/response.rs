use anyhow::{anyhow, Result};
use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Response as HyperResponse,
};
use lagon_runtime_v8_utils::{
    extract_v8_headers_object, extract_v8_integer, extract_v8_string, v8_headers_object,
    v8_integer, v8_string_onebyte, v8_uint8array,
};
use std::{collections::HashMap, str::FromStr};

use crate::{FromV8, IntoV8};

static READABLE_STREAM_STR: &[u8] = b"[object ReadableStream]";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Response {
    pub headers: Option<HashMap<String, Vec<String>>>,
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

// NOTE:
// We can safely use unwrap here because set only return Just(true) or Empty(), so if it should never fail
impl IntoV8 for Response {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let len = if self.headers.is_some() { 3 } else { 2 };

        let mut names = Vec::with_capacity(len);
        let mut values = Vec::with_capacity(len);

        names.push(v8_string_onebyte(scope, "b").into());
        values.push(v8_uint8array(scope, self.body.to_vec()).into());

        names.push(v8_string_onebyte(scope, "s").into());
        values.push(v8_integer(scope, self.status.into()).into());

        if let Some(headers) = self.headers {
            names.push(v8_string_onebyte(scope, "h").into());
            values.push(v8_headers_object(scope, headers).into());
        }

        let null = v8::null(scope).into();
        v8::Object::with_prototype_and_properties(scope, null, &names, &values)
    }
}

impl FromV8 for Response {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        response: v8::Local<'a, v8::Value>,
    ) -> Result<Self> {
        let response = match response.to_object(scope) {
            Some(response) => response,
            None => return Err(anyhow!("Response is not an object")),
        };

        let body;
        let body_key = v8_string_onebyte(scope, "b");

        if let Some(body_value) = response.get(scope, body_key.into()) {
            body = extract_v8_string(body_value, scope)?;
        } else {
            return Err(anyhow!("Could not find body"));
        }

        let mut headers = None;
        let headers_key = v8_string_onebyte(scope, "h");

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
        let status_key = v8_string_onebyte(scope, "s");

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

impl TryFrom<&Response> for http::response::Builder {
    type Error = anyhow::Error;

    fn try_from(response: &Response) -> Result<Self, Self::Error> {
        let mut builder = HyperResponse::builder().status(response.status);

        let builder_headers = match builder.headers_mut() {
            Some(headers) => headers,
            None => return Err(anyhow!("Invalid headers")),
        };

        if let Some(headers) = &response.headers {
            for (key, value) in headers {
                for value in value {
                    builder_headers
                        .append(HeaderName::from_str(key)?, HeaderValue::from_str(value)?);
                }
            }
        }

        Ok(builder)
    }
}

impl Response {
    // TODO: Return the full response length
    pub fn len(&self) -> usize {
        self.body.len()
    }

    pub fn is_empty(&self) -> bool {
        self.body.is_empty()
    }

    pub fn is_streamed(&self) -> bool {
        self.body == READABLE_STREAM_STR
    }

    pub async fn from_hyper(response: HyperResponse<Body>) -> Result<Self> {
        let mut headers = HashMap::<String, Vec<String>>::new();

        for (key, value) in response.headers().iter() {
            headers
                .entry(key.to_string())
                .or_default()
                .push(value.to_str()?.to_string());
        }

        let status = response.status().as_u16();
        let body = body::to_bytes(response.into_body()).await?;

        Ok(Response {
            status,
            headers: if !headers.is_empty() {
                Some(headers)
            } else {
                None
            },
            body,
        })
    }
}
