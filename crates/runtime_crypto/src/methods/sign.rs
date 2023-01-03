use anyhow::{anyhow, Result};
use hmac::Mac;

use crate::{Algorithm, HmacSha256};

pub fn sign(algorithm: Algorithm, key_value: Vec<u8>, data: Vec<u8>) -> Result<Vec<u8>> {
    match algorithm {
        Algorithm::Hmac => {
            let mut mac = HmacSha256::new_from_slice(&key_value).unwrap();
            mac.update(&data);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        _ => Err(anyhow!("Algorithm not supported")),
    }
}
