use crate::{isolate::Isolate, http::Response};

fn log_callback(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let message = args.get(0).to_rust_string_lossy(scope);

    println!("{}", message);
}

fn fetch_callback(
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

    let join_handle = tokio::task::spawn_blocking(move || {
        println!("spawning task");

        let reqwest = reqwest::blocking::get(resource).unwrap();
        let status = reqwest.status().as_u16();
        let body = reqwest.text().unwrap();

        sender.send(Response {
            body,
            headers: None,
            status,
        }).unwrap();
    });

    state.promises.push(join_handle);

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

pub fn bind(scope: &mut v8::HandleScope<()>) -> v8::Global<v8::Context> {
    let global = v8::ObjectTemplate::new(scope);

    let lagon_object = v8::ObjectTemplate::new(scope);

    lagon_object.set(
        v8::String::new(scope, "log").unwrap().into(),
        v8::FunctionTemplate::new(scope, log_callback).into(),
    );

    lagon_object.set(
        v8::String::new(scope, "fetch").unwrap().into(),
        v8::FunctionTemplate::new(scope, fetch_callback).into(),
    );

    global.set(
        v8::String::new(scope, "Lagon").unwrap().into(),
        lagon_object.into(),
    );

    let context = v8::Context::new_from_template(scope, global);
    v8::Global::new(scope, context)
}
