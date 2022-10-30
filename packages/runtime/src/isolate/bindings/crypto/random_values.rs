pub fn random_values_binding(
    _scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    let array = args.get(0);

    // TODO: fill the array with random values

    retval.set(array);
}
