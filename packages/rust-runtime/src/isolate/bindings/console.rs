pub fn console_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let message = args.get(0).to_rust_string_lossy(scope);

    println!("{}", message);
}
