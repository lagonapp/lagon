use anyhow::Result;
use lagon_runtime_crypto::{
    extract_cryptokey_key_value, extract_sign_verify_algorithm, methods::verify, Algorithm,
};
use lagon_runtime_v8_utils::extract_v8_uint8array;

use crate::bindings::{BindingResult, PromiseResult};

type Arg = (Algorithm, Vec<u8>, Vec<u8>, Vec<u8>);

pub fn verify_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let algorithm = extract_sign_verify_algorithm(scope, args.get(0))?;
    let key_value = extract_cryptokey_key_value(scope, args.get(1))?;
    let signature = extract_v8_uint8array(args.get(2))?;
    let data = extract_v8_uint8array(args.get(3))?;

    Ok((algorithm, key_value, signature, data))
}

pub async fn verify_binding(id: usize, arg: Arg) -> BindingResult {
    let algorithm = arg.0;
    let key_value = arg.1;
    let signature = arg.2;
    let data = arg.3;

    match verify(algorithm, key_value, signature, data) {
        Ok(result) => BindingResult {
            id,
            result: PromiseResult::Boolean(result),
        },
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}
