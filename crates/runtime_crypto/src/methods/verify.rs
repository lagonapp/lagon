use anyhow::{anyhow, Result};
use hmac::Mac;
use ring::signature::{EcdsaKeyPair, KeyPair};
use rsa::{pkcs1::DecodeRsaPrivateKey, rand_core::OsRng, PaddingScheme, PublicKey, RsaPrivateKey};
use sha2::{Digest, Sha256};

use crate::{Algorithm, HmacSha256, Sha};

pub fn verify(
    algorithm: Algorithm,
    key_value: Vec<u8>,
    signature: Vec<u8>,
    data: Vec<u8>,
) -> Result<bool> {
    match algorithm {
        Algorithm::Hmac => {
            let mut mac = HmacSha256::new_from_slice(&key_value)?;
            mac.update(&data);
            Ok(mac.verify_slice(&signature).is_ok())
        }
        Algorithm::RsassaPkcs1v15 => {
            let public_key = RsaPrivateKey::from_pkcs1_der(&key_value)?.to_public_key();
            let mut hasher = Sha256::new();
            hasher.update(&data);
            let padding = PaddingScheme::PKCS1v15Sign {
                hash: Some(rsa::hash::Hash::SHA2_256),
            };
            let hashed = hasher.finalize()[..].to_vec();
            Ok(public_key.verify(padding, &hashed, &signature).is_ok())
        }
        Algorithm::RsaPss(salt_length) => {
            let public_key = RsaPrivateKey::from_pkcs1_der(&key_value)?.to_public_key();
            let rng = OsRng;
            let mut hasher = Sha256::new();
            hasher.update(&data);
            let padding = PaddingScheme::new_pss_with_salt::<Sha256, _>(rng, salt_length as usize);
            let hashed = hasher.finalize()[..].to_vec();
            Ok(public_key.verify(padding, &hashed, &signature).is_ok())
        }
        Algorithm::Ecdsa(sha) => match sha {
            Sha::Sha256 => {
                let signing_alg = &ring::signature::ECDSA_P256_SHA256_FIXED_SIGNING;

                let verify = &ring::signature::ECDSA_P256_SHA256_FIXED;

                let private_key = EcdsaKeyPair::from_pkcs8(signing_alg, &key_value)?;

                let public_key_bytes = private_key.public_key().as_ref();

                let public_key = ring::signature::UnparsedPublicKey::new(verify, &public_key_bytes);

                Ok(public_key.verify(&data, &signature).is_ok())
            }
            Sha::Sha384 => {
                let signing_alg = &ring::signature::ECDSA_P384_SHA384_FIXED_SIGNING;
                let verify = &ring::signature::ECDSA_P384_SHA384_FIXED;

                let private_key = EcdsaKeyPair::from_pkcs8(signing_alg, &key_value)?;

                let public_key_bytes = private_key.public_key().as_ref();

                let public_key = ring::signature::UnparsedPublicKey::new(verify, &public_key_bytes);

                Ok(public_key.verify(&data, &signature).is_ok())
            }
            _ => Err(anyhow!("Ecdsa.hash only support Sha256 or Sha384")),
        },
        _ => Err(anyhow!("Algorithm not supported")),
    }
}
