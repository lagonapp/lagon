use crate::{http::StreamResult, isolate::Isolate, utils::extract_v8_uint8array};

pub fn pull_stream_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let isolate_state = Isolate::<()>::state(scope);
    let state = isolate_state.borrow();

    let done = args.get(0).to_boolean(scope);

    if done.is_false() {
        let buf = extract_v8_uint8array(args.get(1)).unwrap();

        state
            .stream_sender
            .send(StreamResult::Data(buf))
            .unwrap_or(());
    } else {
        state.stream_sender.send(StreamResult::Done).unwrap_or(());
    }
}
