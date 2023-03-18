use anyhow::{anyhow, Result};
use async_recursion::async_recursion;
use hyper::{
    client::HttpConnector,
    http::{request::Builder, Uri},
    Body, Client, Response as HyperResponse,
};
use hyper_tls::HttpsConnector;
use lagon_runtime_http::{FromV8, Request, Response};
use lazy_static::lazy_static;

use crate::{bindings::PromiseResult, Isolate};

use super::BindingResult;

lazy_static! {
    static ref CLIENT: Client<HttpsConnector<HttpConnector>> =
        Client::builder().build::<_, Body>(HttpsConnector::new());
}

type Arg = Request;

pub fn fetch_init(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> Result<Arg> {
    let state = Isolate::state(scope);
    let fetch_calls = {
        let mut state = state.borrow_mut();
        // TODO get RequestContext and increment here
        state.fetch_calls += 1;
        state.fetch_calls
    };

    if fetch_calls > 20 {
        return Err(anyhow!("fetch() can only be called 20 times per requests"));
    }

    let request = match args.get(0).to_object(scope) {
        Some(request) => request,
        None => return Err(anyhow!("Invalid request")),
    };

    Request::from_v8(scope, request.into())
}

#[async_recursion]
async fn make_request(
    request: &Request,
    url: Option<String>,
    mut count: u8,
) -> Result<HyperResponse<Body>> {
    if count >= 5 {
        return Err(anyhow!("Too many redirects"));
    }

    let mut hyper_request = Builder::try_from(request)?;

    if let Some(url) = url {
        hyper_request = hyper_request.uri(url);
    }

    let hyper_request = hyper_request.body(Body::from(request.body.clone()))?;
    let uri = hyper_request.uri().clone();
    let response = CLIENT.request(hyper_request).await?;

    if response.status().is_redirection() {
        let mut redirect_url = match response.headers().get("location") {
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
        return make_request(request, Some(redirect_url), count).await;
    }

    Ok(response)
}

pub async fn fetch_binding(id: usize, arg: Arg) -> BindingResult {
    let hyper_response = match make_request(&arg, None, 0).await {
        Ok(hyper_response) => hyper_response,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let result = match Response::from_hyper(hyper_response).await {
        Ok(response) => PromiseResult::Response(response),
        Err(error) => PromiseResult::Error(error.to_string()),
    };

    BindingResult { id, result }
}
