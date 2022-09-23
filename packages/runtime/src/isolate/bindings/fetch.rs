use hyper::{body, http::Request, Client};

use crate::{http::Response, isolate::Isolate};

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

    let (sender, receiver) = std::sync::mpsc::channel();

    let join_handle = tokio::task::spawn_local(async move {
        println!("spawning task");

        let request = Request::builder()
            .method("GET")
            .uri(resource)
            .body(hyper::Body::empty())
            .unwrap();
        let client = Client::new();

        let response = client.request(request).await.unwrap();
        let status = response.status().as_u16();
        let body = body::to_bytes(response.into_body()).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        sender
            .send(Response {
                body,
                headers: None,
                status,
            })
            .unwrap();
    });

    // state.promises.push(join_handle);

    retval.set(promise.into());

    // TODO: should be moved to a real even-loop
    loop {
        if let Ok(response) = receiver.try_recv() {
            let response = response.to_v8_response(scope);

            promise.resolve(scope, response.into());
            break;
        }
    }
}
