use aes::cipher::{block_padding::Pkcs7, BlockEncryptMut, KeyIvInit};
use aes_gcm::{aead::Aead, KeyInit, Nonce};
use anyhow::{anyhow, Result};

use ctr::cipher::StreamCipher;
use ctr::Ctr128BE;
use ctr::Ctr32BE;
use ctr::Ctr64BE;

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
        Algorithm::AesCtr(counter, length) => match length {
            32 => encrypt_aes_ctr_gen::<Ctr32BE<aes::Aes256>>(&key_value, &counter, &data),
            64 => encrypt_aes_ctr_gen::<Ctr64BE<aes::Aes256>>(&key_value, &counter, &data),
            128 => encrypt_aes_ctr_gen::<Ctr128BE<aes::Aes256>>(&key_value, &counter, &data),
            _ => Err(anyhow!(
                "invalid counter length. Currently supported 32/64/128 bits",
            )),
        },
        _ => Err(anyhow!("Algorithm not supported")),
    }
}

fn encrypt_aes_ctr_gen<B>(key: &[u8], counter: &[u8], data: &[u8]) -> Result<Vec<u8>>
where
    B: KeyIvInit + StreamCipher,
{
    let mut cipher = B::new(key.into(), counter.into());

    let mut ciphertext = data.to_vec();
    cipher
        .try_apply_keystream(&mut ciphertext)
        .map_err(|_| anyhow!("tried to encrypt too much data"))?;

    Ok(ciphertext)
}
