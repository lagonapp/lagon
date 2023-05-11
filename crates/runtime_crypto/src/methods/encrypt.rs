use aes::cipher::{block_padding::Pkcs7, BlockEncryptMut, KeyIvInit};
use aes_gcm::{aead::Aead, KeyInit, Nonce};
use anyhow::{anyhow, Result};

use crate::{Aes256Gcm, Algorithm};

type Aes256CbcEnc = cbc::Encryptor<aes::Aes256>;

pub fn encrypt(algorithm: Algorithm, key_value: Vec<u8>, data: Vec<u8>) -> Result<Vec<u8>> {
    match algorithm {
        Algorithm::AesGcm(iv) => {
            let cipher = Aes256Gcm::new_from_slice(&key_value)?;
            let nonce = Nonce::from_slice(&iv);

            match cipher.encrypt(nonce, data.as_ref()) {
                Ok(result) => Ok(result),
                Err(_) => Err(anyhow!("Encryption failed")),
            }
        }
        Algorithm::AesCbc(iv) => Ok(Aes256CbcEnc::new(
            key_value.as_slice().into(),
            iv.as_slice().into(),
        )
        .encrypt_padded_vec_mut::<Pkcs7>(&data)),
        _ => Err(anyhow!("Algorithm not supported")),
    }
}
