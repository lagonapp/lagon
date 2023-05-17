use anyhow::{anyhow, Result};
use async_recursion::async_recursion;
use hyper::{client::HttpConnector, header::LOCATION, http::Uri, Body, Client, Request, Response};
use hyper_tls::HttpsConnector;
use lagon_runtime_http::request_from_v8;
use once_cell::sync::Lazy;

use crate::{bindings::PromiseResult, Isolate};

use super::BindingResult;

static CLIENT: Lazy<Client<HttpsConnector<HttpConnector>>> =
    Lazy::new(|| Client::builder().build::<_, Body>(HttpsConnector::new()));

type Arg = Request<Body>;

pub fn fetch_init(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> Result<Arg> {
    let id = scope
        .get_continuation_preserved_embedder_data()
        .to_uint32(scope)
        .map_or(0, |value| value.value());

    let state = Isolate::state(scope);
    let fetch_calls = {
        let mut state = state.borrow_mut();

        if let Some(mut handler_result) = state.handler_results.get_mut(&id) {
            handler_result.context.fetch_calls += 1;
            handler_result.context.fetch_calls
        } else {
            0
        }
    };

    if fetch_calls > 20 {
        return Err(anyhow!("fetch() can only be called 20 times per requests"));
    }

    let request = match args.get(0).to_object(scope) {
        Some(request) => request,
        None => return Err(anyhow!("Invalid request")),
    };

    request_from_v8(scope, request.into())
}

async fn clone_response(request: Request<Body>) -> Result<(Request<Body>, Request<Body>)> {
    let uri = request.uri().clone();
    let method = request.method().clone();
    let headers = request.headers().clone();
    let body_bytes = hyper::body::to_bytes(request.into_body()).await?;

    let mut request_a = Request::builder().uri(uri.clone()).method(method.clone());
    let request_a_headers = request_a.headers_mut().unwrap();

    let mut request_b = Request::builder().uri(uri).method(method);
    let request_b_headers = request_b.headers_mut().unwrap();

    for (key, value) in headers.iter() {
        request_a_headers.append(key, value.clone());
        request_b_headers.append(key, value.clone());
    }

    let request_a = request_a.body(Body::from(body_bytes.clone()))?;
    let request_b = request_b.body(Body::from(body_bytes))?;

    Ok((request_a, request_b))
}

#[async_recursion]
async fn make_request(
    mut request: Request<Body>,
    url: Option<String>,
    mut count: u8,
) -> Result<Response<Body>> {
    if count >= 5 {
        return Err(anyhow!("Too many redirects"));
    }

    if let Some(url) = url {
        *request.uri_mut() = url.parse()?;
    }

    let uri = request.uri().clone();

    let (request_a, request_b) = clone_response(request).await?;
    let response = CLIENT.request(request_a).await?;

    if response.status().is_redirection() {
        let mut redirect_url = match response.headers().get(LOCATION) {
            Some(location) => location.to_str()?.to_string(),
            None => return Err(anyhow!("Got a redirect without Location header")),
        };

        // Construct the new URL if it's a relative path
        if redirect_url.starts_with('/') {
            let mut uri = uri.into_parts();
            uri.path_and_query = Some(redirect_url.parse()?);

            redirect_url = Uri::from_parts(uri)?.to_string();
        }

        count += 1;
        return make_request(request_b, Some(redirect_url), count).await;
    }

    Ok(response)
}

pub async fn fetch_binding(id: usize, arg: Arg) -> BindingResult {
    let hyper_response = match make_request(arg, None, 0).await {
        Ok(hyper_response) => hyper_response,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let (parts, body) = hyper_response.into_parts();

    match hyper::body::to_bytes(body).await {
        Ok(body) => {
            let response = (parts, body);

            BindingResult {
                id,
                result: PromiseResult::Response(response),
            }
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}
