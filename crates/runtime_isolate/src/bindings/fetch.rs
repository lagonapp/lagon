use anyhow::{anyhow, Result};
use hyper::{Body, Request};
use lagon_runtime_http::request_from_v8;
use reqwest::{redirect::Policy, Client, ClientBuilder};
use std::sync::OnceLock;

use crate::{bindings::PromiseResult, Isolate};

use super::BindingResult;

static CLIENT: OnceLock<Client> = OnceLock::new();

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

pub async fn fetch_binding(id: usize, arg: Arg) -> BindingResult {
    let client = CLIENT.get_or_init(|| {
        ClientBuilder::new()
            .use_rustls_tls()
            .redirect(Policy::custom(|attempt| {
                if attempt.previous().len() >= 5 {
                    attempt.error("Too many redirects")
                } else {
                    attempt.follow()
                }
            }))
            .build()
            .unwrap()
    });

    let (parts, body) = arg.into_parts();

    match client
        .request(parts.method.into(), parts.uri.to_string())
        .headers(parts.headers)
        .body(body)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status().as_u16();
            let headers = response.headers().clone();

            let bytes = match response.bytes().await {
                Ok(bytes) => bytes,
                Err(error) => {
                    return BindingResult {
                        id,
                        result: PromiseResult::Error(format!(
                            "Failed to read response body: {}",
                            error
                        )),
                    }
                }
            };

            BindingResult {
                id,
                result: PromiseResult::Response((status, headers, bytes)),
            }
        }
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.without_url().to_string()),
        },
    }
}
