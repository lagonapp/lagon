use aes::{cipher::typenum::U16, Aes256};
use aes_gcm::AesGcm;
use anyhow::{anyhow, Result};
use hmac::Hmac;
use lagon_runtime_v8_utils::{
    extract_v8_string, extract_v8_uint32, extract_v8_uint8array, v8_string,
};
use sha2::Sha256;

pub mod methods;

pub type HmacSha256 = Hmac<Sha256>;
pub type Aes256Gcm = AesGcm<Aes256, U16>;

pub enum Sha {
    Sha1,
    Sha256,
    Sha384,
    Sha512,
}

pub enum Algorithm {
    Hmac,
    AesGcm(Vec<u8>),
    AesCbc(Vec<u8>),
}

pub enum CryptoNamedCurve {
    P256,
    P384,
}

pub enum DeriveAlgorithm {
    ECDH(CryptoNamedCurve, Vec<u8>),
    /// HKDF(hash, salt, info)
    HKDF(Sha, Vec<u8>, Vec<u8>),
    /// PBKDF2(hash, salt, iterations)
    PBKDF2(Sha, Vec<u8>, u32),
}

pub enum CryptoNamedCurve {
    P256,
    P384,
}

pub enum DeriveAlgorithm {
    ECDH(CryptoNamedCurve, Vec<u8>),
    /// HKDF(hash, salt, info)
    HKDF(Sha, Vec<u8>, Vec<u8>),
    /// PBKDF2(hash, salt, iterations)
    PBKDF2(Sha, Vec<u8>, u32),
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
            return Ok(Algorithm::Hmac);
        }

        if name == "AES-GCM" {
            let iv_key = v8_string(scope, "iv");
            let iv = match algorithm.get(scope, iv_key.into()) {
                Some(iv) => extract_v8_uint8array(iv)?,
                None => return Err(anyhow!("Algorithm iv not found")),
            };

            return Ok(Algorithm::AesGcm(iv));
        }

        if name == "AES-CBC" {
            let iv_key = v8_string(scope, "iv");
            let iv = match algorithm.get(scope, iv_key.into()) {
                Some(iv) => extract_v8_uint8array(iv)?,
                None => return Err(anyhow!("Algorithm iv not found")),
            };

            return Ok(Algorithm::AesCbc(iv));
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
        "SHA-1" => Ok(Sha::Sha1),
        "SHA-256" => Ok(Sha::Sha256),
        "SHA-384" => Ok(Sha::Sha384),
        "SHA-512" => Ok(Sha::Sha512),
        _ => Err(anyhow!("hash not found")),
    }
}

pub fn get_named_curve(curve: &str) -> Result<CryptoNamedCurve> {
    match curve {
        "P-256" => Ok(CryptoNamedCurve::P256),
        "P-384" => Ok(CryptoNamedCurve::P384),
        _ => Err(anyhow!("named_curve not found")),
    }
}

pub fn get_derive_algorithm(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<DeriveAlgorithm> {
    if let Some(algorithm) = value.to_object(scope) {
        let name_key = v8_string(scope, "name");
        let name = match algorithm.get(scope, name_key.into()) {
            Some(name) => extract_v8_string(name, scope)?,
            None => return Err(anyhow!("Algorithm name not found")),
        };

        if name == "ECDH" {
            let curve_key = v8_string(scope, "namedCurve").into();
            let curve = match algorithm.get(scope, curve_key) {
                Some(lv) => {
                    if lv.is_null_or_undefined() {
                        CryptoNamedCurve::P256
                    } else {
                        let curve = extract_v8_string(lv, scope)?;
                        get_named_curve(&curve)?
                    }
                }
                None => CryptoNamedCurve::P256,
            };

            let public_key = v8_string(scope, "public").into();
            let public = match algorithm.get(scope, public_key) {
                Some(public) => extract_cryptokey_key_value(scope, public)?,
                None => return Err(anyhow!("ECDH must have CryptoKey")),
            };

            return Ok(DeriveAlgorithm::ECDH(curve, public));
        }

        if name == "HKDF" {
            let hash_key = v8_string(scope, "hash").into();
            let hash = match algorithm.get(scope, hash_key) {
                Some(hash) => {
                    let hash_str = extract_algorithm_object_or_string(scope, hash)?;
                    get_sha(&hash_str)?
                }
                None => return Err(anyhow!("HKDF must have hash")),
            };

            let salt_key = v8_string(scope, "salt").into();
            let salt = match algorithm.get(scope, salt_key) {
                Some(salt) => extract_v8_uint8array(salt)?,
                None => return Err(anyhow!("HKDF must have salt")),
            };

            let info_key = v8_string(scope, "info").into();
            let info = match algorithm.get(scope, info_key) {
                Some(info) => extract_v8_uint8array(info)?,
                None => return Err(anyhow!("HKDF must have info")),
            };

            return Ok(DeriveAlgorithm::HKDF(hash, salt, info));
        }

        if name == "PBKDF2" {
            let hash_key = v8_string(scope, "hash").into();
            let hash = match algorithm.get(scope, hash_key) {
                Some(hash) => {
                    let hash_str = extract_algorithm_object_or_string(scope, hash)?;
                    get_sha(&hash_str)?
                }
                None => return Err(anyhow!("PBKDF2 must have hash")),
            };

            let salt_key = v8_string(scope, "salt").into();
            let salt = match algorithm.get(scope, salt_key) {
                Some(salt) => extract_v8_uint8array(salt)?,
                None => return Err(anyhow!("PBKDF2 must have salt")),
            };

            let iterations_key = v8_string(scope, "iterations").into();
            let iterations = match algorithm.get(scope, iterations_key) {
                Some(iterations) => extract_v8_uint32(scope, iterations)?,
                None => return Err(anyhow!("PBKDF2 must have iterations")),
            };

            return Ok(DeriveAlgorithm::PBKDF2(hash, salt, iterations));
        }
    }

    Err(anyhow!("Algorithm not supported"))
}
