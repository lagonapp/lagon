use anyhow::{anyhow, Result};
use p256::pkcs8::DecodePrivateKey;
use ring::{hkdf, pbkdf2};
use std::num::NonZeroU32;

use crate::{CryptoNamedCurve, DeriveAlgorithm, Sha};

struct HkdfOutput(usize);

impl hkdf::KeyType for HkdfOutput {
    fn len(&self) -> usize {
        self.0
    }
}

pub fn derive_bits(algorithm: DeriveAlgorithm, key_value: Vec<u8>, length: u32) -> Result<Vec<u8>> {
    match algorithm {
        DeriveAlgorithm::ECDH { curve, public } => match curve {
            CryptoNamedCurve::P256 => {
                let secret_key = p256::SecretKey::from_pkcs8_der(&key_value)
                    .map_err(|_| anyhow!("Unexpected error decoding private key"))?;

                let public_key = p256::SecretKey::from_pkcs8_der(&public)
                    .map_err(|_| anyhow!("Unexpected error decoding public key"))?
                    .public_key();

                let shared_secret = p256::elliptic_curve::ecdh::diffie_hellman(
                    secret_key.to_nonzero_scalar(),
                    public_key.as_affine(),
                );

                Ok(shared_secret.raw_secret_bytes().to_vec())
            }
            CryptoNamedCurve::P384 => {
                let secret_key = p384::SecretKey::from_pkcs8_der(&key_value)
                    .map_err(|_| anyhow!("Unexpected error decoding private key"))?;

                let public_key = p384::SecretKey::from_pkcs8_der(&public)
                    .map_err(|_| anyhow!("Unexpected error decoding public key"))?
                    .public_key();

                let shared_secret = p384::elliptic_curve::ecdh::diffie_hellman(
                    secret_key.to_nonzero_scalar(),
                    public_key.as_affine(),
                );

                Ok(shared_secret.raw_secret_bytes().to_vec())
            }
        },
        DeriveAlgorithm::PBKDF2 {
            hash,
            ref salt,
            iterations,
        } => {
            let hash_algorithm = match hash {
                Sha::Sha1 => pbkdf2::PBKDF2_HMAC_SHA1,
                Sha::Sha256 => pbkdf2::PBKDF2_HMAC_SHA256,
                Sha::Sha384 => pbkdf2::PBKDF2_HMAC_SHA384,
                Sha::Sha512 => pbkdf2::PBKDF2_HMAC_SHA512,
            };

            let mut out = vec![0; (length / 8).try_into()?];
            let not_zero_iterations =
                NonZeroU32::new(iterations).ok_or_else(|| anyhow!("Iterations not zero"))?;

            pbkdf2::derive(
                hash_algorithm,
                not_zero_iterations,
                salt,
                &key_value,
                &mut out,
            );

            Ok(out)
        }
        DeriveAlgorithm::HKDF {
            hash,
            ref salt,
            info,
        } => {
            let hash_algorithm = match hash {
                Sha::Sha1 => hkdf::HKDF_SHA1_FOR_LEGACY_USE_ONLY,
                Sha::Sha256 => hkdf::HKDF_SHA256,
                Sha::Sha384 => hkdf::HKDF_SHA384,
                Sha::Sha512 => hkdf::HKDF_SHA512,
            };

            let salt = hkdf::Salt::new(hash_algorithm, salt);
            let boxed_slice = info.into_boxed_slice();
            let info: &[&[u8]] = &[&*boxed_slice];

            let prk = salt.extract(&key_value);
            let out_length = (length / 8).try_into()?;

            let okm = prk
                .expand(info, HkdfOutput((length / 8).try_into()?))
                .map_err(|_e| anyhow!("The length provided for HKDF is too large"))?;

            let mut out = vec![0u8; out_length];
            okm.fill(&mut out)?;

            Ok(out)
        }
    }
}
