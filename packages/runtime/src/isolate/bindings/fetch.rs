use hyper::{body, http::Request, Client};
use hyper_tls::HttpsConnector;

use crate::{
    http::Response,
    isolate::{bindings::PromiseResult, Isolate},
};

use super::BindingResult;

pub fn fetch_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let resource = args.get(0).to_rust_string_lossy(scope);

    let promise = v8::PromiseResolver::new(scope).unwrap();
    let promise = v8::Local::new(scope, promise);

    let state = Isolate::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let future = async move {
        let request = Request::builder()
            .method("GET")
            .uri(resource)
            .body(hyper::Body::empty())
            .unwrap();
        let client = Client::builder().build::<_, hyper::Body>(HttpsConnector::new());

        let response = client.request(request).await.unwrap();
        let status = response.status().as_u16();
        let body = body::to_bytes(response.into_body()).await.unwrap().to_vec();

        let response = Response {
            body,
            headers: None,
            status,
        };

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
