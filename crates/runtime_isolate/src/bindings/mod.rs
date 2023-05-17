use console::console_binding;
use crypto::{
    decrypt_binding, decrypt_init, digest_binding, encrypt_binding, encrypt_init,
    get_key_value_binding, random_values_binding, sign_binding, sign_init, uuid_binding,
    verify_binding, verify_init,
};
use fetch::{fetch_binding, fetch_init};
use hyper::http::response::Parts;
use lagon_runtime_http::response_to_v8;
use lagon_runtime_v8_utils::{v8_boolean, v8_string, v8_uint8array};
use pull_stream::pull_stream_binding;
use queue_microtask::queue_microtask_binding;
use sleep::{sleep_binding, sleep_init};

use crate::{
    bindings::crypto::{
        derive_bits_binding, derive_bits_init, digest_init, generate_key_binding, generate_key_init,
    },
    Isolate,
};

pub mod console;
pub mod crypto;
pub mod fetch;
pub mod pull_stream;
pub mod queue_microtask;
pub mod sleep;

pub struct BindingResult {
    pub id: usize,
    pub result: PromiseResult,
}

pub enum PromiseResult {
    Response((Parts, Vec<u8>)),
    ArrayBuffer(Vec<u8>),
    Boolean(bool),
    Error(String),
    Undefined,
}

impl PromiseResult {
    pub fn into_value<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Value> {
        match self {
            PromiseResult::Response(response) => response_to_v8(response, scope).into(),
            PromiseResult::ArrayBuffer(bytes) => v8_uint8array(scope, bytes).into(),
            PromiseResult::Boolean(boolean) => v8_boolean(scope, boolean).into(),
            PromiseResult::Error(error) => v8_string(scope, &error).into(),
            PromiseResult::Undefined => v8::undefined(scope).into(),
        }
    }
}

#[derive(PartialEq, Eq, Debug)]
pub enum BindStrategy {
    All,
    Sync,
    Async,
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

            let isolate_state = Isolate::state(scope);
            let mut state = isolate_state.borrow_mut();
            let id = state.js_promises.len() + 1;

            let global_promise = v8::Global::new(scope, promise);
            state.js_promises.insert(id, global_promise);

            // Drop the state so we can borrow
            // it mutably inside init()
            drop(state);

            match $init(scope, args) {
                Ok(args) => {
                    let future = $binding(id, args);

                    isolate_state.borrow_mut().promises.push(Box::pin(future));
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

pub fn bind<'a>(
    scope: &mut v8::HandleScope<'a, ()>,
    bind_strategy: BindStrategy,
) -> v8::Local<'a, v8::Context> {
    let global = v8::ObjectTemplate::new(scope);

    let lagon_object = v8::ObjectTemplate::new(scope);

    if bind_strategy == BindStrategy::All || bind_strategy == BindStrategy::Sync {
        binding!(scope, lagon_object, "log", console_binding);
        binding!(scope, lagon_object, "pullStream", pull_stream_binding);
        binding!(scope, lagon_object, "uuid", uuid_binding);
        binding!(scope, lagon_object, "randomValues", random_values_binding);
        binding!(scope, lagon_object, "getKeyValue", get_key_value_binding);
        binding!(
            scope,
            lagon_object,
            "queueMicrotask",
            queue_microtask_binding
        );

        global.set(v8_string(scope, "LagonSync").into(), lagon_object.into());
    }

    if bind_strategy == BindStrategy::All || bind_strategy == BindStrategy::Async {
        let lagon_object = v8::ObjectTemplate::new(scope);

        async_binding!(scope, lagon_object, "fetch", fetch_init, fetch_binding);
        async_binding!(scope, lagon_object, "sign", sign_init, sign_binding);
        async_binding!(scope, lagon_object, "verify", verify_init, verify_binding);
        async_binding!(scope, lagon_object, "digest", digest_init, digest_binding);
        async_binding!(
            scope,
            lagon_object,
            "deriveBits",
            derive_bits_init,
            derive_bits_binding
        );
        async_binding!(
            scope,
            lagon_object,
            "encrypt",
            encrypt_init,
            encrypt_binding
        );
        async_binding!(
            scope,
            lagon_object,
            "decrypt",
            decrypt_init,
            decrypt_binding
        );
        async_binding!(scope, lagon_object, "sleep", sleep_init, sleep_binding);
        async_binding!(
            scope,
            lagon_object,
            "generateKey",
            generate_key_init,
            generate_key_binding
        );

        global.set(v8_string(scope, "LagonAsync").into(), lagon_object.into());
    }

    v8::Context::new_from_template(scope, global)
}
