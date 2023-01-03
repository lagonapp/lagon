use anyhow::{anyhow, Result};
use hmac::Mac;

use crate::{Algorithm, HmacSha256};

pub fn verify(
    algorithm: Algorithm,
    key_value: Vec<u8>,
    signature: Vec<u8>,
    data: Vec<u8>,
) -> Result<bool> {
    match algorithm {
        Algorithm::Hmac => {
            let mut mac = HmacSha256::new_from_slice(&key_value).unwrap();
            mac.update(&data);
            Ok(mac.verify_slice(&signature).is_ok())
        }
        _ => Err(anyhow!("Algorithm not supported")),
    }
}
