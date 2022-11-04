use anyhow::{anyhow, Result};
use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Request as HyperRequest,
};
use std::{collections::HashMap, str::FromStr};

use crate::utils::{extract_v8_headers_object, extract_v8_string, v8_headers_object, v8_string};

use super::{FromV8, IntoV8, Method};

#[derive(Debug)]
pub struct Request {
    pub headers: Option<HashMap<String, String>>,
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
        let request = v8::Object::new(scope);

        let input_key = v8_string(scope, "input");
        let input_value = v8_string(scope, &self.url);
        request
            .set(scope, input_key.into(), input_value.into())
            .unwrap();

        let method_key = v8_string(scope, "method");
        let method_value = v8_string(scope, self.method.into());
        request
            .set(scope, method_key.into(), method_value.into())
            .unwrap();

        if !self.body.is_empty() {
            let body_key = v8_string(scope, "body");
            let body_value = v8_string(scope, &String::from_utf8(self.body.to_vec()).unwrap());
            request
                .set(scope, body_key.into(), body_value.into())
                .unwrap();
        }

        let headers_key = v8_string(scope, "headers");

        if let Some(headers) = self.headers {
            let headers_value = v8_headers_object(scope, headers);
            request
                .set(scope, headers_key.into(), headers_value.into())
                .unwrap();
        }

        request
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
        let body_key = v8_string(scope, "body");

        if let Some(body_value) = request.get(scope, body_key.into()) {
            if !body_value.is_null_or_undefined() {
                body = Bytes::from(extract_v8_string(body_value, scope)?);
            }
        }

        let mut headers = None;
        let headers_key = v8_string(scope, "headers");

        if let Some(headers_value) = request.get(scope, headers_key.into()) {
            if !headers_value.is_null_or_undefined() {
                headers = extract_v8_headers_object(headers_value, scope)?;
            }
        }

        let mut method = Method::GET;
        let method_key = v8_string(scope, "method");

        if let Some(method_value) = request.get(scope, method_key.into()) {
            method = Method::from(extract_v8_string(method_value, scope)?.as_str());
        }

        let url;
        let url_key = v8_string(scope, "url");

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
            None => return Err(anyhow!("Invalid headers").into()),
        };

        if let Some(headers) = &request.headers {
            for (key, value) in headers {
                builder_headers.insert(HeaderName::from_str(key)?, HeaderValue::from_str(value)?);
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

    pub async fn from_hyper(request: HyperRequest<Body>) -> Result<Self> {
        let mut headers = HashMap::new();

        for (key, value) in request.headers().iter() {
            headers.insert(key.to_string(), value.to_str().unwrap().to_string());
        }

        let method = Method::from(request.method());
        let host = headers
            .get("host")
            .map(|host| host.to_string())
            .unwrap_or_default();
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

    pub fn add_header(&mut self, key: String, value: String) {
        if let Some(ref mut headers) = self.headers {
            headers.insert(key, value);
        }
    }
}
