use lagon_runtime_http::StreamResult;
use lagon_runtime_v8_utils::{extract_v8_uint8array, v8_exception};

use crate::Isolate;

pub fn pull_stream_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let isolate_state = Isolate::state(scope);
    let state = isolate_state.borrow();

    let done = args.get(0).to_boolean(scope);

    if done.is_false() {
        match extract_v8_uint8array(args.get(1)) {
            Ok(buf) => {
                state
                    .stream_sender
                    .send(StreamResult::Data(buf))
                    .unwrap_or(());
            }
            Err(error) => {
                let exception = v8_exception(scope, error.to_string().as_str());
                scope.throw_exception(exception);
            }
        }
    } else {
        state.stream_sender.send(StreamResult::Done).unwrap_or(());
    }
}
