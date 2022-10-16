use hyper::{http::request::Builder, Body, Client};
use hyper_tls::HttpsConnector;

use crate::{
    http::{FromV8, Request, Response},
    isolate::{bindings::PromiseResult, Isolate},
};

use super::BindingResult;

pub fn fetch_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let request = args.get(0).to_object(scope).unwrap();
    let request = Request::from_v8(scope, request.into()).unwrap();

    let promise = v8::PromiseResolver::new(scope).unwrap();
    let promise = v8::Local::new(scope, promise);

    let state = Isolate::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let future = async move {
        let hyper_request = Builder::from(&request);
        let hyper_request = hyper_request.body(Body::from(request.body)).unwrap();

        let client = Client::builder().build::<_, Body>(HttpsConnector::new());

        let hyper_response = client.request(hyper_request).await.unwrap();
        let response = Response::from_hyper(hyper_response).await;

        BindingResult {
            id,
            result: PromiseResult::Response(response),
        }
    };

    state.promises.push(Box::pin(future));

    let global_promise = v8::Global::new(scope, promise);
    state.js_promises.insert(id, global_promise);

    retval.set(promise.into());
}
