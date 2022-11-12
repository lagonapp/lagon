use anyhow::{anyhow, Result};
use hmac::Hmac;
use sha2::{Sha256, Sha384, Sha512};

use crate::utils::{extract_v8_string, extract_v8_uint8array, v8_string};

pub type HmacSha256 = Hmac<Sha256>;
pub type HmacSha384 = Hmac<Sha384>;
pub type HmacSha512 = Hmac<Sha512>;

pub enum Algorithm {
    HmacSha256,
    HmacSha384,
    HmacSha512,
}

pub fn extract_algorithm_object(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<(String, String)> {
    if let Some(algorithm) = value.to_object(scope) {
        let name_key = v8_string(scope, "name");
        let name = match algorithm.get(scope, name_key.into()) {
            Some(name) => extract_v8_string(name, scope)?,
            None => return Err(anyhow!("Algorithm name not found")),
        };

        let hash_key = v8_string(scope, "hash");
        let hash = match algorithm.get(scope, hash_key.into()) {
            Some(hash) => extract_v8_string(hash, scope)?,
            None => return Err(anyhow!("Algorithm hash not found")),
        };

        return Ok((name, hash));
    }

    Err(anyhow!("Algorithm not supported"))
}

pub fn extract_algorithm_object_or_string(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<String> {
    if value.is_string() {
        return extract_v8_string(value, scope);
    } else if let Some(algorithm) = value.to_object(scope) {
        let name_key = v8_string(scope, "name");
        let name = match algorithm.get(scope, name_key.into()) {
            Some(name) => extract_v8_string(name, scope)?,
            None => return Err(anyhow!("Algorithm name not found")),
        };

        return Ok(name);
    }

    Err(anyhow!("Algorithm not supported"))
}

pub fn extract_cryptokey_key_value(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<Vec<u8>> {
    if let Some(key) = value.to_object(scope) {
        let value_key = v8_string(scope, "keyValue");

        return match key.get(scope, value_key.into()) {
            Some(value) => Ok(extract_v8_uint8array(value)?),
            None => Err(anyhow!("CryptoKey keyValue not found")),
        };
    }

    Err(anyhow!("CryptoKey not supported"))
}

pub fn get_algorithm(name: &str, hash: &str) -> Option<Algorithm> {
    match name {
        "HMAC" => match hash {
            "SHA-256" => Some(Algorithm::HmacSha256),
            "SHA-384" => Some(Algorithm::HmacSha384),
            "SHA-512" => Some(Algorithm::HmacSha512),
            _ => None,
        },
        _ => None,
    }
}
