use anyhow::{anyhow, Result};
use ring::hmac::{self, Algorithm};

use crate::utils::{extract_v8_string, extract_v8_uint8array, v8_string};

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
            "SHA-256" => Some(hmac::HMAC_SHA256),
            "SHA-384" => Some(hmac::HMAC_SHA384),
            "SHA-512" => Some(hmac::HMAC_SHA512),
            _ => None,
        },
        _ => None,
    }
}
