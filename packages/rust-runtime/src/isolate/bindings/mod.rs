use console::console_binding;
use fetch::fetch_binding;

mod fetch;
mod console;

pub fn bind(scope: &mut v8::HandleScope<()>) -> v8::Global<v8::Context> {
    let global = v8::ObjectTemplate::new(scope);

    let lagon_object = v8::ObjectTemplate::new(scope);

    lagon_object.set(
        v8::String::new(scope, "log").unwrap().into(),
        v8::FunctionTemplate::new(scope, console_binding).into(),
    );

    lagon_object.set(
        v8::String::new(scope, "fetch").unwrap().into(),
        v8::FunctionTemplate::new(scope, fetch_binding).into(),
    );

    global.set(
        v8::String::new(scope, "Lagon").unwrap().into(),
        lagon_object.into(),
    );

    let context = v8::Context::new_from_template(scope, global);
    v8::Global::new(scope, context)
}
