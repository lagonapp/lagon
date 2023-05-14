use anyhow::{anyhow, Result};
use hmac::Mac;
use rand::rngs::OsRng;
use ring::rand::SystemRandom;
use ring::signature::EcdsaKeyPair;
use rsa::{
    pkcs1::DecodeRsaPrivateKey,
    pss::Pss,
    sha2::{Digest, Sha256},
};
use rsa::{Pkcs1v15Sign, RsaPrivateKey};

use crate::{Algorithm, HmacSha256, Sha};

pub fn sign(algorithm: Algorithm, key_value: Vec<u8>, data: Vec<u8>) -> Result<Vec<u8>> {
    match algorithm {
        Algorithm::Hmac => {
            let mut mac = HmacSha256::new_from_slice(&key_value)?;
            mac.update(&data);

            Ok(mac.finalize().into_bytes().to_vec())
        }
        Algorithm::RsassaPkcs1v15 => {
            let private_key = RsaPrivateKey::from_pkcs1_der(&key_value)?;
            let mut hasher = Sha256::new();
            hasher.update(&data);

            let hashed = hasher.finalize()[..].to_vec();

            Ok(private_key.sign(Pkcs1v15Sign::new::<Sha256>(), &hashed)?)
        }
        Algorithm::RsaPss(salt_length) => {
            let private_key = RsaPrivateKey::from_pkcs1_der(&key_value)?;
            let mut rng = OsRng;
            let mut hasher = Sha256::new();
            hasher.update(&data);

            let hashed = hasher.finalize()[..].to_vec();

            Ok(private_key.sign_with_rng(
                &mut rng,
                Pss::new_with_salt::<Sha256>(salt_length as usize),
                &hashed,
            )?)
        }
        Algorithm::Ecdsa(sha) => match sha {
            Sha::Sha256 => {
                let curve = &ring::signature::ECDSA_P256_SHA256_FIXED_SIGNING;
                let key_pair = EcdsaKeyPair::from_pkcs8(curve, &key_value)?;

                let rng = SystemRandom::new();
                let signature = key_pair.sign(&rng, &data)?;

                Ok(signature.as_ref().to_vec())
            }
            Sha::Sha384 => {
                let curve = &ring::signature::ECDSA_P384_SHA384_FIXED_SIGNING;
                let key_pair = EcdsaKeyPair::from_pkcs8(curve, &key_value)?;

                let rng = SystemRandom::new();
                let signature = key_pair.sign(&rng, &data)?;

                Ok(signature.as_ref().to_vec())
            }
            _ => Err(anyhow!("Ecdsa.hash only support Sha256 or Sha384")),
        },
        _ => Err(anyhow!("Algorithm not supported")),
    }
}
