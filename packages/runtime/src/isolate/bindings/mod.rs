use console::console_binding;
use fetch::fetch_binding;
use pull_stream::pull_stream_binding;

use crate::http::Response;

mod console;
mod fetch;
mod pull_stream;

pub struct BindingResult {
    pub id: usize,
    pub result: PromiseResult,
}

pub enum PromiseResult {
    Response(Response),
}

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

    lagon_object.set(
        v8::String::new(scope, "pullStream").unwrap().into(),
        v8::FunctionTemplate::new(scope, pull_stream_binding).into(),
    );

    global.set(
        v8::String::new(scope, "Lagon").unwrap().into(),
        lagon_object.into(),
    );

    let context = v8::Context::new_from_template(scope, global);
    v8::Global::new(scope, context)
}
