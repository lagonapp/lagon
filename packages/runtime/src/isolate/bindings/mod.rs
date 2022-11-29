use console::console_binding;
use crypto::{
    decrypt_binding, decrypt_init, digest_binding, encrypt_binding, encrypt_init,
    get_key_value_binding, random_values_binding, sign_binding, sign_init, uuid_binding,
    verify_binding, verify_init,
};
use fetch::{fetch_binding, fetch_init};
use pull_stream::pull_stream_binding;

use crate::{
    http::Response,
    isolate::{bindings::crypto::digest_init, Isolate},
    utils::v8_string,
};

pub mod console;
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

macro_rules! binding {
    ($scope: ident, $lagon_object: ident, $name: literal, $binding: ident) => {
        $lagon_object.set(
            v8_string($scope, $name).into(),
            v8::FunctionTemplate::new($scope, $binding).into(),
        );
    };
}

macro_rules! async_binding {
    ($scope: ident, $lagon_object: ident, $name: literal, $init: expr, $binding: expr) => {
        let binding = |scope: &mut v8::HandleScope,
                       args: v8::FunctionCallbackArguments,
                       mut retval: v8::ReturnValue| {
            let promise = v8::PromiseResolver::new(scope).unwrap();
            retval.set(promise.into());

            let state = Isolate::state(scope);
            let mut state = state.borrow_mut();
            let id = state.js_promises.len() + 1;

            let global_promise = v8::Global::new(scope, promise);
            state.js_promises.insert(id, global_promise);

            match $init(scope, args) {
                Ok(args) => {
                    let future = $binding(id, args);

                    state.promises.push(Box::pin(future));
                }
                Err(error) => {
                    let error = v8_string(scope, &error.to_string());
                    promise.reject(scope, error.into());
                }
            }
        };

        $lagon_object.set(
            v8_string($scope, $name).into(),
            v8::FunctionTemplate::new($scope, binding).into(),
        );
    };
}

pub fn bind<'a>(scope: &mut v8::HandleScope<'a, ()>) -> v8::Local<'a, v8::Context> {
    let global = v8::ObjectTemplate::new(scope);
    let lagon_object = v8::ObjectTemplate::new(scope);

    binding!(scope, lagon_object, "log", console_binding);
    // async_binding!(scope, lagon_object, "fetch", fetch_init, fetch_binding);
    // binding!(scope, lagon_object, "pullStream", pull_stream_binding);
    // binding!(scope, lagon_object, "uuid", uuid_binding);
    // binding!(scope, lagon_object, "randomValues", random_values_binding);
    // async_binding!(scope, lagon_object, "sign", sign_init, sign_binding);
    // async_binding!(scope, lagon_object, "verify", verify_init, verify_binding);
    // binding!(scope, lagon_object, "getKeyValue", get_key_value_binding);
    // async_binding!(scope, lagon_object, "digest", digest_init, digest_binding);
    // async_binding!(
    //     scope,
    //     lagon_object,
    //     "encrypt",
    //     encrypt_init,
    //     encrypt_binding
    // );
    // async_binding!(
    //     scope,
    //     lagon_object,
    //     "decrypt",
    //     decrypt_init,
    //     decrypt_binding
    // );

    global.set(v8_string(scope, "Lagon").into(), lagon_object.into());

    v8::Context::new_from_template(scope, global)
}
