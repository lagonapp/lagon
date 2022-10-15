use hyper::{body, Body, Method as HyperMethod, Request as HyperRequest};
use std::collections::HashMap;

use super::{IntoV8, Method};

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

    pub async fn from(request: HyperRequest<Body>) -> Self {
        let mut headers = HashMap::new();

        for (key, value) in request.headers().iter() {
            headers.insert(key.to_string(), value.to_str().unwrap().to_string());
        }

        let method = match *request.method() {
            HyperMethod::POST => Method::POST,
            HyperMethod::PUT => Method::PUT,
            HyperMethod::PATCH => Method::PATCH,
            HyperMethod::DELETE => Method::DELETE,
            HyperMethod::HEAD => Method::HEAD,
            HyperMethod::OPTIONS => Method::OPTIONS,
            _ => Method::GET,
        };

        let host = headers
            .get("host")
            .map(|host| host.to_string())
            .unwrap_or_default();
        let url = format!("http://{}{}", host, request.uri().to_string().as_str());

        let body = body::to_bytes(request.into_body()).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        Request {
            headers,
            method,
            body,
            url,
        }
    }
}
