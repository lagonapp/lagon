use console::console_binding;
use crypto::{
    get_key_value_binding, random_values_binding, sign_binding, uuid_binding, verify_binding,
};
use fetch::fetch_binding;
use pull_stream::pull_stream_binding;

use crate::{http::Response, utils::v8_string};

mod console;
mod crypto;
mod fetch;
mod pull_stream;

pub struct BindingResult {
    pub id: usize,
    pub result: PromiseResult,
}

pub enum PromiseResult {
    Response(Response),
    ArrayBuffer(Vec<u8>),
    Boolean(bool),
    Error(String),
}

pub fn bind(scope: &mut v8::HandleScope<()>) -> v8::Global<v8::Context> {
    let global = v8::ObjectTemplate::new(scope);

    let lagon_object = v8::ObjectTemplate::new(scope);

    lagon_object.set(
        v8_string(scope, "log").into(),
        v8::FunctionTemplate::new(scope, console_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "fetch").into(),
        v8::FunctionTemplate::new(scope, fetch_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "pullStream").into(),
        v8::FunctionTemplate::new(scope, pull_stream_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "uuid").into(),
        v8::FunctionTemplate::new(scope, uuid_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "randomValues").into(),
        v8::FunctionTemplate::new(scope, random_values_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "sign").into(),
        v8::FunctionTemplate::new(scope, sign_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "verify").into(),
        v8::FunctionTemplate::new(scope, verify_binding).into(),
    );

    lagon_object.set(
        v8_string(scope, "getKeyValue").into(),
        v8::FunctionTemplate::new(scope, get_key_value_binding).into(),
    );

    global.set(v8_string(scope, "Lagon").into(), lagon_object.into());

    let context = v8::Context::new_from_template(scope, global);
    v8::Global::new(scope, context)
}
