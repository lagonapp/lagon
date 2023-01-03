use lagon_runtime_crypto::methods::random_values;
use lagon_runtime_v8_utils::v8_uint8array;

pub fn random_values_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let value = args.get(0);
    let chunk = unsafe { v8::Local::<v8::TypedArray>::cast(value) };
    let mut buf = vec![0; chunk.byte_length()];
    chunk.copy_contents(&mut buf);

    let buf = random_values(buf);
    let result = v8_uint8array(scope, buf);

    retval.set(result.into());
}
