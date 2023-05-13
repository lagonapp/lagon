use anyhow::{anyhow, Ok, Result};
use lagon_runtime_v8_utils::{
    extract_v8_string, extract_v8_uint32, extract_v8_uint8array, v8_string,
};
use num_traits::FromPrimitive;
use once_cell::sync::Lazy;
use ring::rand::SecureRandom;
use ring::signature::EcdsaKeyPair;
use rsa::pkcs1::EncodeRsaPrivateKey;
use rsa::rand_core::OsRng;
use rsa::{BigUint, RsaPrivateKey};

use crate::{get_named_curve, get_sha_hash_from_v8_obj, CryptoNamedCurve, Sha};

#[derive(Debug)]
pub enum KeyGenAlgorithm {
    Rsa {
        modulus_length: u32,
        public_exponent: Vec<u8>,
    },
    Ec {
        named_curve: CryptoNamedCurve,
    },
    Aes {
        length: u32,
    },
    Hmac {
        hash: Sha,
        length: Option<u32>,
    },
}

pub fn get_generate_key_algorithm(
    scope: &mut v8::HandleScope,
    value: v8::Local<v8::Value>,
) -> Result<KeyGenAlgorithm> {
    if let Some(algorithm) = value.to_object(scope) {
        let name_key = v8_string(scope, "name");
        let name = match algorithm.get(scope, name_key.into()) {
            Some(name) => extract_v8_string(name, scope)?,
            None => return Err(anyhow!("Algorithm name not found")),
        };

        if name == "RSASSA-PKCS1-v1_5" || name == "RSA-PSS" || name == "RSA-OAEP" {
            let modulus_length_key = v8_string(scope, "modulusLength");
            let modulus_length = match algorithm.get(scope, modulus_length_key.into()) {
                Some(modulus_length) => extract_v8_uint32(scope, modulus_length)?,
                None => return Err(anyhow!("Algorithm modulusLength not found")),
            };

            let public_exponent_key = v8_string(scope, "publicExponent");
            let public_exponent = match algorithm.get(scope, public_exponent_key.into()) {
                Some(public_exponent) => extract_v8_uint8array(public_exponent)?,
                None => return Err(anyhow!("Algorithm publicExponent not found")),
            };

            // let sha = get_sha_hash_from_v8_obj(scope, algorithm)?;

            return Ok(KeyGenAlgorithm::Rsa {
                modulus_length,
                public_exponent,
                // hash: sha,
            });
        }

        if name == "ECDSA" || name == "ECDH" {
            let curve_key = v8_string(scope, "namedCurve").into();
            let curve = match algorithm.get(scope, curve_key) {
                Some(lv) => {
                    let curve = extract_v8_string(lv, scope)?;
                    get_named_curve(&curve)?
                }
                None => return Err(anyhow!("Algorithm namedCurve not found")),
            };

            return Ok(KeyGenAlgorithm::Ec { named_curve: curve });
        }

        if name == "HMAC" {
            let sha = get_sha_hash_from_v8_obj(scope, algorithm)?;

            let length_key = v8_string(scope, "length").into();
            let length = match algorithm.get(scope, length_key) {
                Some(lv) => {
                    if lv.is_null_or_undefined() {
                        None
                    } else {
                        let length = extract_v8_uint32(scope, lv)?;
                        std::option::Option::Some(length)
                    }
                }
                None => None,
            };

            Ok(KeyGenAlgorithm::Hmac { hash: sha, length });
        }

        if name == "AES-CTR" || name == "AES-CBC" || name == "AES-GCM" || name == "AES-KW" {
            let length_key = v8_string(scope, "length");
            let length = match algorithm.get(scope, length_key.into()) {
                Some(length) => extract_v8_uint32(scope, length)?,
                None => return Err(anyhow!("Algorithm length not found")),
            };

            if length != 128 || length != 192 || length != 256 {
                return Err(anyhow!(
                    "Algorithm length must be one of: 128, 192, or 256."
                ));
            }

            Ok(KeyGenAlgorithm::Aes { length });
        }
    }
    Err(anyhow!(
        "Algorithm must be RsaHashedKeyGenParams | EcKeyGenParams | HmacKeyGenParams | AesKeyGenParams"
    ))
}

static PUB_EXPONENT_1: Lazy<BigUint> = Lazy::new(|| BigUint::from_u64(3).unwrap());
static PUB_EXPONENT_2: Lazy<BigUint> = Lazy::new(|| BigUint::from_u64(65537).unwrap());

pub fn generate_key(algorithm: KeyGenAlgorithm) -> Result<Vec<u8>> {
    match algorithm {
        KeyGenAlgorithm::Rsa {
            modulus_length,
            ref public_exponent,
        } => {
            let exponent = BigUint::from_bytes_be(public_exponent);
            if exponent != *PUB_EXPONENT_1 && exponent != *PUB_EXPONENT_2 {
                return Err(anyhow!("Bad public exponent"));
            }

            let mut rng = OsRng;

            let private_key =
                RsaPrivateKey::new_with_exp(&mut rng, modulus_length as usize, &exponent)
                    .map_err(|_| anyhow!("Failed to generate RSA key"))?;

            let private_key = private_key
                .to_pkcs1_der()
                .map_err(|_| anyhow!("Failed to serialize RSA key"))?;

            Ok(private_key.as_bytes().to_vec())
        }
        KeyGenAlgorithm::Ec { named_curve } => {
            let curve = match named_curve {
                CryptoNamedCurve::P256 => &ring::signature::ECDSA_P256_SHA256_FIXED_SIGNING,
                CryptoNamedCurve::P384 => &ring::signature::ECDSA_P384_SHA384_FIXED_SIGNING,
            };
            let rng = ring::rand::SystemRandom::new();

            let pkcs8 = EcdsaKeyPair::generate_pkcs8(curve, &rng)
                .map_err(|_| anyhow!("Failed to generate EC key"))?;

            Ok(pkcs8.as_ref().to_vec())
        }
        KeyGenAlgorithm::Aes { length } => {
            let length = length as usize;
            if length % 8 != 0 || length > 256 {
                return Err(anyhow!("Invalid AES key length"));
            }

            let mut key = vec![0u8; length / 8];
            let rng = ring::rand::SystemRandom::new();
            rng.fill(&mut key)
                .map_err(|_| anyhow!("Failed to generate key"))?;

            Ok(key)
        }
        KeyGenAlgorithm::Hmac { hash, length } => {
            let hash = match hash {
                Sha::Sha1 => &ring::hmac::HMAC_SHA1_FOR_LEGACY_USE_ONLY,
                Sha::Sha256 => &ring::hmac::HMAC_SHA256,
                Sha::Sha384 => &ring::hmac::HMAC_SHA384,
                Sha::Sha512 => &ring::hmac::HMAC_SHA512,
            };

            let length = if let Some(length) = length {
                if length % 8 != 0 {
                    return Err(anyhow!("Invalid HMAC key length"));
                }

                let length = length / 8;
                if length > ring::digest::MAX_BLOCK_LEN.try_into().unwrap() {
                    return Err(anyhow!("Invalid HMAC key length"));
                }

                length as usize
            } else {
                hash.digest_algorithm().block_len
            };

            let rng = ring::rand::SystemRandom::new();
            let mut key = vec![0u8; length];
            rng.fill(&mut key)
                .map_err(|_| anyhow!("Failed to generate key"))?;

            Ok(key)
        }
    }
}
