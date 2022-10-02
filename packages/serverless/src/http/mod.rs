use std::collections::HashMap;
use std::str::FromStr;

use hyper::{
    body, header::HeaderName, http::HeaderValue, Body, Method as HyperMethod,
    Request as HyperRequest, Response as HyperResponse,
};
use lagon_runtime::http::{Method, Request, Response};

pub async fn hyper_request_to_request(request: HyperRequest<Body>) -> Request {
    let mut headers = HashMap::new();

    for (key, value) in request.headers().iter() {
        headers.insert(key.to_string(), value.to_str().unwrap().to_string());
    }

    let method = match request.method() {
        &HyperMethod::POST => Method::POST,
        &HyperMethod::PUT => Method::PUT,
        &HyperMethod::PATCH => Method::PATCH,
        &HyperMethod::DELETE => Method::DELETE,
        &HyperMethod::HEAD => Method::HEAD,
        &HyperMethod::OPTIONS => Method::OPTIONS,
        _ => Method::GET,
    };

    let host = headers
        .get("host")
        .map(|host| host.to_string())
        .unwrap_or(String::new());
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

pub fn response_to_hyper_response(response: Response) -> hyper::Response<Body> {
    let mut builder = HyperResponse::builder().status(response.status);

    let builder_headers = builder.headers_mut().unwrap();

    if let Some(headers) = response.headers {
        for (key, value) in headers {
            builder_headers.insert(
                HeaderName::from_str(&key).unwrap(),
                HeaderValue::from_str(&value).unwrap(),
            );
        }
    }

    builder.body(response.body.into()).unwrap()
}
