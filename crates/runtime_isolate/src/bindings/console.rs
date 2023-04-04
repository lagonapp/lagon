use log::error;

use crate::Isolate;

pub fn console_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let level = args.get(0).to_rust_string_lossy(scope);
    let message = args.get(1).to_rust_string_lossy(scope);
    let state = Isolate::state(scope);
    let state = state.borrow();

    if let Some(log_sender) = state.log_sender.as_ref() {
        if let Err(error) = log_sender.send((level, message, state.metadata.as_ref().clone())) {
            error!("Failed to send log message: {}", error)
        }
    }
}
