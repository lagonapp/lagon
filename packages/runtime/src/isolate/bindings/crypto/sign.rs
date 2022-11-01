use crate::isolate::{
    bindings::{BindingResult, PromiseResult},
    Isolate,
};
use ring::{hmac, rand::SystemRandom};

pub fn sign_binding(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let promise = v8::PromiseResolver::new(scope).unwrap();

    let state = Isolate::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let future = async move {
        // TODO: should use values from the args
        let rng = SystemRandom::new();
        let key = hmac::Key::generate(hmac::HMAC_SHA256, &rng).unwrap();

        let tag = hmac::sign(&key, "Hello".as_bytes());
        let tag = tag.as_ref();

        BindingResult {
            id,
            result: PromiseResult::ArrayBuffer(tag.to_vec()),
        }
    };

    state.promises.push(Box::pin(future));

    let global_promise = v8::Global::new(scope, promise);
    state.js_promises.insert(id, global_promise);

    retval.set(promise.into());
}
