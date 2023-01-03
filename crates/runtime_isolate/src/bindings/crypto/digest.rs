use anyhow::Result;
use lagon_runtime_crypto::{extract_algorithm_object_or_string, methods::digest};
use lagon_runtime_v8_utils::extract_v8_uint8array;

use crate::bindings::{BindingResult, PromiseResult};

type Arg = (String, Vec<u8>);

pub fn digest_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let name = extract_algorithm_object_or_string(scope, args.get(0))?;
    let data = extract_v8_uint8array(args.get(1))?;

    Ok((name, data))
}

pub async fn digest_binding(id: usize, arg: Arg) -> BindingResult {
    let name = arg.0;
    let data = arg.1;

    match digest(name.as_str(), data) {
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
