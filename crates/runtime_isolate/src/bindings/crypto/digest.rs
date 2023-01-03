use anyhow::Result;
use lagon_runtime_v8_utils::extract_v8_uint8array;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha384, Sha512};

use crate::{
    bindings::{BindingResult, PromiseResult},
    crypto::extract_algorithm_object_or_string,
};

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

    let result = match name.as_str() {
        "SHA-1" => {
            let mut hasher = Sha1::new();
            hasher.update(data);
            hasher.finalize().to_vec()
        }
        "SHA-256" => {
            let mut hasher = Sha256::new();
            hasher.update(data);
            hasher.finalize().to_vec()
        }
        "SHA-384" => {
            let mut hasher = Sha384::new();
            hasher.update(data);
            hasher.finalize().to_vec()
        }
        "SHA-512" => {
            let mut hasher = Sha512::new();
            hasher.update(data);
            hasher.finalize().to_vec()
        }
        _ => {
            return BindingResult {
                id,
                result: PromiseResult::Error("Algorithm not found".into()),
            }
        }
    };

    BindingResult {
        id,
        result: PromiseResult::ArrayBuffer(result),
    }
}
