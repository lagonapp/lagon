use anyhow::Result;
use lagon_runtime_crypto::methods::generate_key::{
    generate_key, get_generate_key_algorithm, KeyGenAlgorithm,
};

use crate::bindings::{BindingResult, PromiseResult};

type Arg = KeyGenAlgorithm;

pub fn generate_key_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let algorithm = get_generate_key_algorithm(scope, args.get(0))?;

    Ok(algorithm)
}

pub async fn generate_key_binding(id: usize, arg: Arg) -> BindingResult {
    let algorithm = arg;

    match generate_key(algorithm) {
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
