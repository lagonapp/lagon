use crate::{
    crypto::extract_algorithm_object_or_string,
    isolate::{
        bindings::{BindingResult, PromiseResult},
        Isolate,
    },
    utils::{extract_v8_uint8array, v8_string},
};
use ring::digest;

pub fn digest_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let promise = v8::PromiseResolver::new(scope).unwrap();
    retval.set(promise.into());

    let state = Isolate::<()>::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let global_promise = v8::Global::new(scope, promise);
    state.js_promises.insert(id, global_promise);

    let name = match extract_algorithm_object_or_string(scope, args.get(0)) {
        Ok(value) => value,
        Err(error) => {
            let error = v8_string(scope, &error.to_string());
            promise.reject(scope, error.into());
            return;
        }
    };

    let data = match extract_v8_uint8array(args.get(1)) {
        Ok(value) => value,
        Err(_) => {
            let error = v8_string(scope, "Data must be an Uint8Array");
            promise.reject(scope, error.into());
            return;
        }
    };

    let future = async move {
        let algorithm = match name.as_str() {
            "SHA-1" => &digest::SHA1_FOR_LEGACY_USE_ONLY,
            "SHA-256" => &digest::SHA256,
            "SHA-384" => &digest::SHA384,
            "SHA-512" => &digest::SHA512,
            _ => {
                return BindingResult {
                    id,
                    result: PromiseResult::Error("Algorithm not found".into()),
                }
            }
        };

        let digest = digest::digest(algorithm, &data);

        BindingResult {
            id,
            result: PromiseResult::ArrayBuffer(digest.as_ref().to_vec()),
        }
    };

    state.promises.push(Box::pin(future));
}
