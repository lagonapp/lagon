use anyhow::{anyhow, Result};
use hyper::{client::HttpConnector, http::request::Builder, Body, Client};
use hyper_tls::HttpsConnector;
use lazy_static::lazy_static;

use crate::{
    http::{FromV8, Request, Response},
    isolate::bindings::PromiseResult,
};

use super::BindingResult;

lazy_static! {
    static ref CLIENT: Client<HttpsConnector<HttpConnector>> =
        Client::builder().build::<_, Body>(HttpsConnector::new());
}

type Arg = Request;

pub fn fetch_init(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> Result<Arg> {
    let request = match args.get(0).to_object(scope) {
        Some(request) => request,
        None => return Err(anyhow!("Invalid request")),
    };

    Request::from_v8(scope, request.into())
}

pub async fn fetch_binding(id: usize, arg: Arg) -> BindingResult {
    let hyper_request = match Builder::try_from(&arg) {
        Ok(hyper_request) => hyper_request,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let hyper_request = match hyper_request.body(Body::from(arg.body)) {
        Ok(hyper_request) => hyper_request,
        Err(error) => {
            return BindingResult {
                id,
                result: PromiseResult::Error(error.to_string()),
            }
        }
    };

    let hyper_response = match CLIENT.request(hyper_request).await {
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
