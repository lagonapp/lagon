use anyhow::Result;
use hmac::Mac;
use lagon_runtime_v8_utils::extract_v8_uint8array;

use crate::{
    crypto::{
        extract_algorithm_object, extract_cryptokey_key_value, Algorithm, HmacSha256, HmacSha384,
        Sha,
    },
    isolate::bindings::{BindingResult, PromiseResult},
};

type Arg = (Algorithm, Vec<u8>, Vec<u8>, Vec<u8>);

pub fn verify_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let algorithm = extract_algorithm_object(scope, args.get(0))?;
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

    let result = match algorithm {
        Algorithm::Hmac(sha) => match sha {
            Sha::Sha256 => {
                let mut mac = HmacSha256::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.verify_slice(&signature).is_ok()
            }
            Sha::Sha384 => {
                let mut mac = HmacSha384::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.verify_slice(&signature).is_ok()
            }
            Sha::Sha512 => {
                let mut mac = HmacSha256::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.verify_slice(&signature).is_ok()
            }
        },
        _ => {
            return BindingResult {
                id,
                result: PromiseResult::Error("Algorithm not supported".into()),
            }
        }
    };

    BindingResult {
        id,
        result: PromiseResult::Boolean(result),
    }
}
