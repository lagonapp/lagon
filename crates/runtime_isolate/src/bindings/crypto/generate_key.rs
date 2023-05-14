use anyhow::Result;
use lagon_runtime_crypto::{
    extract_generate_key_algorithm, methods::generate_key, KeyGenAlgorithm,
};

use crate::bindings::{BindingResult, PromiseResult};

type Arg = KeyGenAlgorithm;

pub fn generate_key_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    extract_generate_key_algorithm(scope, args.get(0))
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
