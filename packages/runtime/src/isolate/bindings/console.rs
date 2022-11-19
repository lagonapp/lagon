use log::{debug, error, info, warn};

use crate::isolate::Isolate;

const SOURCE: &str = "console";

pub fn console_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let level = args.get(0).to_rust_string_lossy(scope);
    let message = args.get(1).to_rust_string_lossy(scope);
    let state = Isolate::<(String, String)>::state(scope);
    let state = state.borrow();

    if let Some((deployment, function)) = &state.metadata {
        let deployment = deployment.as_str();
        let function = function.as_str();

        match level.as_str() {
            "debug" => {
                debug!(source = SOURCE, deployment = deployment, function = function; "{}", message)
            }
            "warn" => {
                warn!(source = SOURCE, deployment = deployment, function = function; "{}", message)
            }
            "error" => {
                error!(source = SOURCE, deployment = deployment, function = function; "{}", message)
            }
            _ => {
                info!(source = SOURCE, deployment = deployment, function = function; "{}", message)
            }
        };
    }
}
