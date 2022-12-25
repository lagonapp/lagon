use aes::{cipher::typenum::U16, Aes256};
use aes_gcm::AesGcm;
use anyhow::{anyhow, Result};
use hmac::Hmac;
use sha2::{Sha256, Sha384, Sha512};

use crate::utils::{extract_v8_string, extract_v8_uint8array, v8_string};

pub type HmacSha256 = Hmac<Sha256>;
pub type HmacSha384 = Hmac<Sha384>;
pub type HmacSha512 = Hmac<Sha512>;
pub type Aes256Gcm = AesGcm<Aes256, U16>;

pub enum Sha {
    Sha256,
    Sha384,
    Sha512,
}

pub enum Algorithm {
    Hmac(Sha),
    AesGcm(Vec<u8>),
}

pub fn extract_algorithm_object(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<Algorithm> {
    if let Some(algorithm) = value.to_object(scope) {
        let name_key = v8_string(scope, "name");
        let name = match algorithm.get(scope, name_key.into()) {
            Some(name) => extract_v8_string(name, scope)?,
            None => return Err(anyhow!("Algorithm name not found")),
        };

        if name == "HMAC" {
            let hash_key = v8_string(scope, "hash");
            let hash = match algorithm.get(scope, hash_key.into()) {
                Some(hash) => extract_v8_string(hash, scope)?,
                None => return Err(anyhow!("Algorithm hash not found")),
            };

            let sha = get_sha(&hash)?;

            return Ok(Algorithm::Hmac(sha));
        }

        if name == "AES-GCM" {
            let iv_key = v8_string(scope, "iv");
            let iv = match algorithm.get(scope, iv_key.into()) {
                Some(iv) => extract_v8_uint8array(iv)?,
                None => return Err(anyhow!("Algorithm iv not found")),
            };

            return Ok(Algorithm::AesGcm(iv));
        }
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

pub fn get_sha(hash: &str) -> Result<Sha> {
    match hash {
        "SHA-256" => Ok(Sha::Sha256),
        "SHA-384" => Ok(Sha::Sha384),
        "SHA-512" => Ok(Sha::Sha512),
        _ => Err(anyhow!("hash not found")),
    }
}
