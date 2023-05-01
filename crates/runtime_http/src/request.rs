use anyhow::{anyhow, Result};
use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Request as HyperRequest,
};
use lagon_runtime_v8_utils::{
    extract_v8_headers_object, extract_v8_string, v8_headers_object, v8_string,
};
use std::str::FromStr;

use crate::{Headers, X_LAGON_ID};

use super::{FromV8, IntoV8, Method};

#[derive(Debug)]
pub struct Request {
    pub headers: Option<Headers>,
    pub method: Method,
    pub body: Bytes,
    pub url: String,
}

impl Default for Request {
    fn default() -> Self {
        Request {
            headers: None,
            method: Method::GET,
            body: Bytes::new(),
            url: "".into(),
        }
    }
}

// NOTE:
// We can safely use unwrap here because set only return Just(true) or Empty(), so if it should never fail
impl IntoV8 for Request {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let mut len = if self.headers.is_some() { 3 } else { 2 };
        let body_exists = !self.body.is_empty();

        if body_exists {
            len += 1;
        }

        let mut names = Vec::with_capacity(len);
        let mut values = Vec::with_capacity(len);

        names.push(v8_string(scope, "i").into());
        values.push(v8_string(scope, &self.url).into());

        names.push(v8_string(scope, "m").into());
        values.push(v8_string(scope, self.method.into()).into());

        if body_exists {
            names.push(v8_string(scope, "b").into());
            values.push(v8_string(scope, std::str::from_utf8(&self.body).unwrap()).into());
        }

        if let Some(headers) = self.headers {
            names.push(v8_string(scope, "h").into());
            values.push(v8_headers_object(scope, headers).into());
        }

        let null = v8::null(scope);
        v8::Object::with_prototype_and_properties(scope, null.into(), &names, &values)
    }
}

impl FromV8 for Request {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        request: v8::Local<'a, v8::Value>,
    ) -> Result<Self> {
        let request = match request.to_object(scope) {
            Some(request) => request,
            None => return Err(anyhow!("Request is not an object")),
        };

        let mut body = Bytes::new();
        let body_key = v8_string(scope, "b");

        if let Some(body_value) = request.get(scope, body_key.into()) {
            if !body_value.is_null_or_undefined() {
                body = Bytes::from(extract_v8_string(body_value, scope)?);
            }
        }

        let mut headers = None;
        let headers_key = v8_string(scope, "h");

        if let Some(headers_value) = request.get(scope, headers_key.into()) {
            if !headers_value.is_null_or_undefined() {
                headers = extract_v8_headers_object(headers_value, scope)?;
            }
        }

        let mut method = Method::GET;
        let method_key = v8_string(scope, "m");

        if let Some(method_value) = request.get(scope, method_key.into()) {
            method = Method::from(extract_v8_string(method_value, scope)?.as_str());
        }

        let url;
        let url_key = v8_string(scope, "u");

        if let Some(url_value) = request.get(scope, url_key.into()) {
            url = extract_v8_string(url_value, scope)?;
        } else {
            return Err(anyhow!("Could not find url"));
        }

        Ok(Self {
            headers,
            method,
            body,
            url,
        })
    }
}

impl TryFrom<&Request> for http::request::Builder {
    type Error = anyhow::Error;

    fn try_from(request: &Request) -> Result<Self, Self::Error> {
        let mut builder = HyperRequest::builder()
            .uri(&request.url)
            .method::<&str>(request.method.into());

        let builder_headers = match builder.headers_mut() {
            Some(headers) => headers,
            None => return Err(anyhow!("Invalid headers")),
        };

        if let Some(headers) = &request.headers {
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

impl Request {
    // TODO: Return the full request length
    pub fn len(&self) -> usize {
        self.body.len()
    }

    pub fn is_empty(&self) -> bool {
        self.body.is_empty()
    }

    pub async fn from_hyper(request: HyperRequest<Body>) -> Result<Self> {
        Self::from_hyper_with_capacity(request, 0).await
    }

    pub async fn from_hyper_with_capacity(
        request: HyperRequest<Body>,
        capacity: usize,
    ) -> Result<Self> {
        let host = request
            .headers()
            .get("host")
            .map_or_else(String::new, |host| {
                host.to_str()
                    .map_or_else(|_| String::new(), |value| value.to_string())
            });

        let mut headers = Vec::with_capacity(request.headers().keys_len() + capacity);

        for key in request.headers().keys() {
            if key != X_LAGON_ID {
                // We guess that most of the time there will be only one header value
                let mut values = Vec::with_capacity(1);

                for value in request.headers().get_all(key) {
                    values.push(value.to_str()?.to_string());
                }

                headers.push((key.to_string(), values));
            }
        }

        let method = Method::from(request.method());
        let url = format!("http://{}{}", host, request.uri().to_string().as_str());

        let body = body::to_bytes(request.into_body()).await?;

        Ok(Request {
            headers: if !headers.is_empty() {
                Some(headers)
            } else {
                None
            },
            method,
            body,
            url,
        })
    }

    pub fn set_header(&mut self, key: String, value: String) {
        if let Some(ref mut headers) = self.headers {
            headers.push((key, vec![value]));
        }
    }
}
