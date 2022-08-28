
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
    // let init = args.get(1).to_rust_string_lossy(scope);

    println!("fetching: {}", resource);

    let response = v8::Object::new(scope);

    let body_key = v8::String::new(scope, "body").unwrap();
    let body_key = v8::Local::new(scope, body_key);
    let body_value = v8::String::new(scope, "VALUE").unwrap();
    let body_value = v8::Local::new(scope, body_value);

    response.set(scope, body_key.into(), body_value.into());

    let promise = v8::PromiseResolver::new(scope).unwrap();
    promise.resolve(scope, response.into());

    let promise = v8::Local::new(scope, promise);

    retval.set(promise.into());
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
