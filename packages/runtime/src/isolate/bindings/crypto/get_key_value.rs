use ring::{rand::SystemRandom, signature::Ed25519KeyPair};

use crate::utils::v8_uint8array;

pub fn get_key_value_binding(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let document = Ed25519KeyPair::generate_pkcs8(&SystemRandom::new()).unwrap();
    let value = v8_uint8array(scope, document.as_ref().to_vec());

    retval.set(value.into());
}
