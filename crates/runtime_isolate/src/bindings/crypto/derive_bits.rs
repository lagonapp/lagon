use anyhow::Result;
use lagon_runtime_crypto::{
    extract_cryptokey_key_value, extract_derive_algorithm, methods::derive_bits, DeriveAlgorithm,
};
use lagon_runtime_v8_utils::extract_v8_uint32;

use crate::bindings::{BindingResult, PromiseResult};

type Arg = (DeriveAlgorithm, Vec<u8>, u32);

pub fn derive_bits_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let algorithm = extract_derive_algorithm(scope, args.get(0))?;
    let key_value = extract_cryptokey_key_value(scope, args.get(1))?;
    let length = extract_v8_uint32(scope, args.get(2))?;

    Ok((algorithm, key_value, length))
}

pub async fn derive_bits_binding(id: usize, arg: Arg) -> BindingResult {
    let algorithm = arg.0;
    let key_value = arg.1;
    let length = arg.2;

    match derive_bits(algorithm, key_value, length) {
        Ok(result) => BindingResult {
            id,
            result: PromiseResult::ArrayBuffer(result),
        },
        Err(error) => BindingResult {
            id,
            result: PromiseResult::Error(error.to_string()),
        },
    }
}
