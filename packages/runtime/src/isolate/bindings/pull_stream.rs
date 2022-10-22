use crate::{http::StreamResult, isolate::Isolate};

pub fn pull_stream_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut _retval: v8::ReturnValue,
) {
    let isolate_state = Isolate::state(scope);
    let state = isolate_state.borrow();

    let done = args.get(0).to_boolean(scope);

    if done.is_false() {
        let chunk = unsafe { v8::Local::<v8::Uint8Array>::cast(args.get(1)) };
        let mut buf = vec![0; chunk.byte_length()];
        chunk.copy_contents(&mut buf);

        state.stream_sender.send(StreamResult::Data(buf)).unwrap();
    } else {
        state.stream_sender.send(StreamResult::Done).unwrap();
    }
}
