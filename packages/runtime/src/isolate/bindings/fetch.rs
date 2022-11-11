use hyper::{http::request::Builder, Body, Client};
use hyper_tls::HttpsConnector;

use crate::{
    http::{FromV8, Request, Response},
    isolate::{bindings::PromiseResult, Isolate},
    utils::v8_string,
};

use super::BindingResult;

pub fn fetch_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let promise = v8::PromiseResolver::new(scope).unwrap();
    retval.set(promise.into());

    let state = Isolate::<()>::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let global_promise = v8::Global::new(scope, promise);
    state.js_promises.insert(id, global_promise);

    let request = match args.get(0).to_object(scope) {
        Some(request) => request,
        None => {
            let error = v8_string(scope, "Invalid request");
            promise.reject(scope, error.into());
            return;
        }
    };

    let request = match Request::from_v8(scope, request.into()) {
        Ok(request) => request,
        Err(error) => {
            let error = v8_string(scope, &error.to_string());
            promise.reject(scope, error.into());
            return;
        }
    };

    let future = async move {
        let hyper_request = match Builder::try_from(&request) {
            Ok(hyper_request) => hyper_request,
            Err(error) => {
                return BindingResult {
                    id,
                    result: PromiseResult::Error(error.to_string()),
                }
            }
        };

        let hyper_request = match hyper_request.body(Body::from(request.body)) {
            Ok(hyper_request) => hyper_request,
            Err(error) => {
                return BindingResult {
                    id,
                    result: PromiseResult::Error(error.to_string()),
                }
            }
        };

        let client = Client::builder().build::<_, Body>(HttpsConnector::new());

        let hyper_response = match client.request(hyper_request).await {
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
    };

    state.promises.push(Box::pin(future));
}
