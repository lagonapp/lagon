use anyhow::{anyhow, Result};
use ring::hmac::{self, Algorithm};

use crate::utils::{extract_v8_string, v8_string};

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
