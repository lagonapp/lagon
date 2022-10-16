use hyper::{
    body::{self, Bytes},
    header::HeaderName,
    http::{self, HeaderValue},
    Body, Request as HyperRequest,
};
use std::{collections::HashMap, str::FromStr};

use crate::utils::{extract_v8_string, v8_string};

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

impl IntoV8 for Request {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let request = v8::Object::new(scope);

        let input_key = v8_string(scope, "input").unwrap();
        let input_value = v8::String::new(scope, &self.url).unwrap();
        let input_value = v8::Local::new(scope, input_value);
        request
            .set(scope, input_key.into(), input_value.into())
            .unwrap();

        let method_key = v8_string(scope, "method").unwrap();
        let method_value = v8::String::new(scope, self.method.into()).unwrap();
        let method_value = v8::Local::new(scope, method_value);
        request
            .set(scope, method_key.into(), method_value.into())
            .unwrap();

        if !self.body.is_empty() {
            let body_key = v8_string(scope, "body").unwrap();
            let body_value =
                v8::String::new(scope, &String::from_utf8(self.body.to_vec()).unwrap()).unwrap();
            let body_value = v8::Local::new(scope, body_value);
            request
                .set(scope, body_key.into(), body_value.into())
                .unwrap();
        }

        let headers_key = v8_string(scope, "headers").unwrap();
        let request_headers = v8::Object::new(scope);

        if let Some(headers) = self.headers {
            for (key, value) in headers.iter() {
                let key = v8::String::new(scope, key).unwrap();
                let key = v8::Local::new(scope, key);
                let value = v8::String::new(scope, value).unwrap();
                let value = v8::Local::new(scope, value);
                request_headers.set(scope, key.into(), value.into());
            }

            request
                .set(scope, headers_key.into(), request_headers.into())
                .unwrap();
        }

        request
    }
}

impl FromV8 for Request {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        request: v8::Local<'a, v8::Value>,
    ) -> Option<Self> {
        let response = request.to_object(scope)?;

        let mut body = Bytes::new();
        let body_key = v8_string(scope, "body")?;

        if let Some(body_value) = response.get(scope, body_key.into()) {
            if !body_value.is_null_or_undefined() {
                body = Bytes::from(extract_v8_string(body_value, scope)?);
            }
        }

        let mut headers = None;
        let headers_key = v8_string(scope, "headers")?;

        if let Some(headers_map) = response.get(scope, headers_key.into()) {
            if !headers_map.is_null_or_undefined() {
                let headers_map = unsafe { v8::Local::<v8::Map>::cast(headers_map) };

                if headers_map.size() > 0 {
                    let mut final_headers = HashMap::new();

                    let headers_keys = headers_map.as_array(scope);

                    for mut index in 0..headers_keys.length() {
                        if index % 2 != 0 {
                            continue;
                        }

                        let key = headers_keys
                            .get_index(scope, index)?
                            .to_rust_string_lossy(scope);
                        index += 1;
                        let value = headers_keys
                            .get_index(scope, index)?
                            .to_rust_string_lossy(scope);

                        final_headers.insert(key, value);
                    }

                    headers = Some(final_headers);
                }
            }
        }

        let mut method = Method::GET;
        let method_key = v8_string(scope, "method")?;

        if let Some(method_value) = response.get(scope, method_key.into()) {
            method = Method::from(extract_v8_string(method_value, scope)?.as_str());
        }

        let url_key = v8_string(scope, "url")?;
        let url = response.get(scope, url_key.into())?;
        let url = extract_v8_string(url, scope)?;

        Some(Self {
            headers,
            method,
            body,
            url,
        })
    }
}

impl From<&Request> for http::request::Builder {
    fn from(request: &Request) -> Self {
        let mut builder = HyperRequest::builder()
            .uri(&request.url)
            .method::<&str>(request.method.into());

        let builder_headers = builder.headers_mut().unwrap();

        if let Some(headers) = &request.headers {
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

impl Request {
    // TODO: Return the full request length
    pub fn len(&self) -> usize {
        self.body.len()
    }

    pub async fn from_hyper(request: HyperRequest<Body>) -> Self {
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

        let body = body::to_bytes(request.into_body()).await.unwrap();

        Request {
            headers: if !headers.is_empty() {
                Some(headers)
            } else {
                None
            },
            method,
            body,
            url,
        }
    }
}
