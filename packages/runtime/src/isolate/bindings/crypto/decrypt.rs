use crate::{
    crypto::{extract_algorithm_object, extract_cryptokey_key_value, Algorithm},
    isolate::{
        bindings::{BindingResult, PromiseResult},
        Isolate,
    },
    utils::{extract_v8_uint8array, v8_string},
};
use aes_gcm::{aead::Aead, Aes256Gcm};
use aes_gcm::{KeyInit, Nonce};

pub fn decrypt_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let promise = v8::PromiseResolver::new(scope).unwrap();

    let state = Isolate::<()>::state(scope);
    let mut state = state.borrow_mut();
    let id = state.js_promises.len() + 1;

    let algorithm = match extract_algorithm_object(scope, args.get(0)) {
        Ok(value) => value,
        Err(error) => {
            let error = v8_string(scope, &error.to_string());
            promise.reject(scope, error.into());
            return;
        }
    };

    let key_value = match extract_cryptokey_key_value(scope, args.get(1)) {
        Ok(value) => value,
        Err(error) => {
            let error = v8_string(scope, &error.to_string());
            promise.reject(scope, error.into());
            return;
        }
    };

    let data = match extract_v8_uint8array(args.get(2)) {
        Ok(value) => value,
        Err(_) => {
            let error = v8_string(scope, "Data must be an Uint8Array");
            promise.reject(scope, error.into());
            return;
        }
    };

    let future = async move {
        let result = match algorithm {
            Algorithm::AesGcm(iv) => {
                let cipher = Aes256Gcm::new_from_slice(&key_value).unwrap();
                let nonce = Nonce::from_slice(&iv);
                cipher.decrypt(nonce, data.as_ref()).unwrap()
            }
            _ => {
                return BindingResult {
                    id,
                    result: PromiseResult::Error("Algorithm not supported".into()),
                }
            }
        };

        BindingResult {
            id,
            result: PromiseResult::ArrayBuffer(result),
        }
    };

    state.promises.push(Box::pin(future));

    let global_promise = v8::Global::new(scope, promise);
    state.js_promises.insert(id, global_promise);

    retval.set(promise.into());
}
