use std::collections::HashMap;

use crate::utils::{extract_v8_string, v8_string};

pub trait IntoV8 {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object>;
}

pub trait FromV8: Sized {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        object: v8::Local<'a, v8::Value>,
    ) -> Option<Self>;
}

#[derive(Debug, Copy, Clone)]
pub enum Method {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    HEAD,
    OPTIONS,
}

impl From<Method> for &str {
    fn from(method: Method) -> &'static str {
        match method {
            Method::GET => "GET",
            Method::POST => "POST",
            Method::PUT => "PUT",
            Method::PATCH => "PATCH",
            Method::DELETE => "DELETE",
            Method::HEAD => "HEAD",
            Method::OPTIONS => "OPTIONS",
        }
    }
}

#[derive(Debug)]
pub struct Request {
    pub headers: HashMap<String, String>,
    pub method: Method,
    pub body: String,
    pub url: String,
}

impl Default for Request {
    fn default() -> Self {
        Request {
            headers: HashMap::new(),
            method: Method::GET,
            body: "".into(),
            url: "".into(),
        }
    }
}

impl IntoV8 for Request {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let request = v8::Object::new(scope);

        let input_key = v8::String::new(scope, "input").unwrap();
        let input_key = v8::Local::new(scope, input_key);
        let input_value = v8::String::new(scope, &self.url).unwrap();
        let input_value = v8::Local::new(scope, input_value);
        request
            .set(scope, input_key.into(), input_value.into())
            .unwrap();

        let method_key = v8::String::new(scope, "method").unwrap();
        let method_key = v8::Local::new(scope, method_key);
        let method_value = v8::String::new(scope, self.method.into()).unwrap();
        let method_value = v8::Local::new(scope, method_value);
        request
            .set(scope, method_key.into(), method_value.into())
            .unwrap();

        let body_key = v8::String::new(scope, "body").unwrap();
        let body_key = v8::Local::new(scope, body_key);
        let body_value = v8::String::new(scope, &self.body).unwrap();
        let body_value = v8::Local::new(scope, body_value);
        request
            .set(scope, body_key.into(), body_value.into())
            .unwrap();

        let headers_key = v8::String::new(scope, "headers").unwrap();
        let headers_key = v8::Local::new(scope, headers_key);

        let request_headers = v8::Object::new(scope);

        for (key, value) in self.headers.iter() {
            let key = v8::String::new(scope, key).unwrap();
            let key = v8::Local::new(scope, key);
            let value = v8::String::new(scope, value).unwrap();
            let value = v8::Local::new(scope, value);
            request_headers.set(scope, key.into(), value.into());
        }

        request
            .set(scope, headers_key.into(), request_headers.into())
            .unwrap();

        request
    }
}

impl Request {
    // TODO: Return the full request length
    pub fn len(&self) -> usize {
        self.body.len()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Response {
    pub headers: Option<HashMap<String, String>>,
    pub body: Vec<u8>,
    pub status: u16,
}

impl Default for Response {
    fn default() -> Self {
        Response {
            headers: None,
            body: [].into(),
            status: 200,
        }
    }
}

impl From<&str> for Response {
    fn from(body: &str) -> Self {
        Response {
            headers: None,
            body: body.into(),
            status: 200,
        }
    }
}

impl IntoV8 for Response {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object> {
        let response_object = v8::Object::new(scope);
        let body_key = v8::String::new(scope, "body").unwrap();
        let body_key = v8::Local::new(scope, body_key);
        let body_value = v8::String::new(scope, std::str::from_utf8(&self.body).unwrap()).unwrap();
        let body_value = v8::Local::new(scope, body_value);

        response_object.set(scope, body_key.into(), body_value.into());
        response_object
    }
}

impl FromV8 for Response {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        response: v8::Local<'a, v8::Value>,
    ) -> Option<Self> {
        let response = response.to_object(scope)?;

        let body_key = v8_string(scope, "body")?;
        let body = response.get(scope, body_key.into())?;
        let body = extract_v8_string(body, scope)?;

        let headers_key = v8_string(scope, "headers")?;
        let headers_object = response.get(scope, headers_key.into())?.to_object(scope)?;
        let headers_map = headers_object.get(scope, headers_key.into())?;
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

        let status_key = v8_string(scope, "status")?;
        let status = response
            .get(scope, status_key.into())?
            .integer_value(scope)? as u16;

        Some(Self {
            headers,
            body: body.into_bytes(),
            status,
        })
    }
}

impl Response {
    // TODO: Return the full response length
    pub fn len(&self) -> usize {
        self.body.len()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StreamResult {
    Start,
    Data(&'static [u8]),
    Done,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RunResult {
    Response(Response),
    Stream(StreamResult),
    Timeout,
    MemoryLimit,
    Error(String),
    NotFound,
}
