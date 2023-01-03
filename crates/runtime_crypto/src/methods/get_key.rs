use aes_gcm::{aead::OsRng, KeyInit};

use crate::Aes256Gcm;

pub fn get_key() -> Vec<u8> {
    Aes256Gcm::generate_key(&mut OsRng).to_vec()
}
