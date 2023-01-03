use lagon_runtime_crypto::methods::uuid;

use lagon_runtime_v8_utils::v8_string;

pub fn uuid_binding(
    scope: &mut v8::HandleScope,
    _args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let uuid = uuid();
    let uuid = v8_string(scope, &uuid);

    retval.set(uuid.into());
}
