use crate::{
    crypto::{extract_algorithm_object, extract_cryptokey_key_value, Algorithm},
    isolate::bindings::{BindingResult, PromiseResult},
    utils::extract_v8_uint8array,
};
use aes_gcm::{aead::Aead, Aes256Gcm};
use aes_gcm::{KeyInit, Nonce};
use anyhow::Result;

type Arg = (Algorithm, Vec<u8>, Vec<u8>);

pub fn encrypt_init(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Arg> {
    let algorithm = extract_algorithm_object(scope, args.get(0))?;
    let key_value = extract_cryptokey_key_value(scope, args.get(1))?;
    let data = extract_v8_uint8array(args.get(2))?;

    Ok((algorithm, key_value, data))
}

pub async fn encrypt_binding(id: usize, arg: Arg) -> BindingResult {
    let algorithm = arg.0;
    let key_value = arg.1;
    let data = arg.2;

    let result = match algorithm {
        Algorithm::AesGcm(iv) => {
            let cipher = Aes256Gcm::new_from_slice(&key_value).unwrap();
            let nonce = Nonce::from_slice(&iv);
            cipher.encrypt(nonce, data.as_ref()).unwrap()
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
}
