pub fn queue_microtask_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let value = args.get(0);
    // TODO: check if value is a function
    let function = unsafe { v8::Local::<v8::Function>::cast(value) };

    scope.enqueue_microtask(function);
}
