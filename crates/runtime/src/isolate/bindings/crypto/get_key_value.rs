use aes_gcm::{aead::OsRng, Aes256Gcm, KeyInit};

use lagon_runtime_v8_utils::v8_uint8array;

pub fn get_key_value_binding(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let key = Aes256Gcm::generate_key(&mut OsRng);
    let value = v8_uint8array(scope, key.to_vec());

    retval.set(value.into());
}
