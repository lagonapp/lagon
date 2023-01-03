use lagon_runtime_crypto::methods::get_key;
use lagon_runtime_v8_utils::v8_uint8array;

pub fn get_key_value_binding(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let key = get_key();
    let value = v8_uint8array(scope, key);

    retval.set(value.into());
}
