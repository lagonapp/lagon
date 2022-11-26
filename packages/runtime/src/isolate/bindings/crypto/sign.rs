use crate::{
    crypto::{
        extract_algorithm_object, extract_cryptokey_key_value, Algorithm, HmacSha256, HmacSha384,
        HmacSha512, Sha,
    },
    isolate::bindings::{BindingResult, PromiseResult},
    utils::extract_v8_uint8array,
};
use anyhow::Result;
use hmac::Mac;

type Arg = (Algorithm, Vec<u8>, Vec<u8>);

pub fn sign_init(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> Result<Arg> {
    let algorithm = extract_algorithm_object(scope, args.get(0))?;
    let key_value = extract_cryptokey_key_value(scope, args.get(1))?;
    let data = extract_v8_uint8array(args.get(2))?;

    Ok((algorithm, key_value, data))
}

pub async fn sign_binding(id: usize, arg: Arg) -> BindingResult {
    let algorithm = arg.0;
    let key_value = arg.1;
    let data = arg.2;

    let result = match algorithm {
        Algorithm::Hmac(sha) => match sha {
            Sha::Sha256 => {
                let mut mac = HmacSha256::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.finalize().into_bytes().to_vec()
            }
            Sha::Sha384 => {
                let mut mac = HmacSha384::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.finalize().into_bytes().to_vec()
            }
            Sha::Sha512 => {
                let mut mac = HmacSha512::new_from_slice(&key_value).unwrap();
                mac.update(&data);
                mac.finalize().into_bytes().to_vec()
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
        result: PromiseResult::ArrayBuffer(result),
    }
}
