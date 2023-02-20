use lagon_runtime_v8_utils::v8_string;

use crate::get_exception_message;

use super::Isolate;

pub extern "C" fn heap_limit_callback(
    data: *mut std::ffi::c_void,
    current_heap_limit: usize,
    _initial_heap_limit: usize,
) -> usize {
    let isolate = unsafe { &mut *(data as *mut Isolate) };
    isolate.terminate();

    // Avoid OOM killer by increasing the limit, since we kill
    // the isolate above.
    current_heap_limit * 2
}

pub extern "C" fn promise_reject_callback(message: v8::PromiseRejectMessage) {
    let scope = &mut unsafe { v8::CallbackScope::new(&message) };
    let promise = message.get_promise();
    let promise = v8::Global::new(scope, promise);

    let isolate = Isolate::state(scope);
    let mut state = isolate.borrow_mut();

    match message.get_event() {
        v8::PromiseRejectEvent::PromiseRejectWithNoHandler => {
            let try_catch = &mut v8::TryCatch::new(scope);

            let exception_message = match message.get_value() {
                Some(exception) => get_exception_message(try_catch, exception, state.lines),
                None => "Unknown error".to_string(),
            };

            state.rejected_promises.insert(promise, exception_message);
        }
        v8::PromiseRejectEvent::PromiseHandlerAddedAfterReject => {
            state.rejected_promises.remove(&promise);
        }
        _ => {}
    }
}

// We don't allow imports at all, so we return None and throw an error
// so it can be catched later. As the error message suggests, all code
// should be bundled into a single file.
pub fn resolve_module_callback<'a>(
    context: v8::Local<'a, v8::Context>,
    _: v8::Local<'a, v8::String>,
    _: v8::Local<'a, v8::FixedArray>,
    _: v8::Local<'a, v8::Module>,
) -> Option<v8::Local<'a, v8::Module>> {
    let scope = &mut unsafe { v8::CallbackScope::new(context) };

    let message = v8_string(
        scope,
        "Can't import modules, everything should be bundled in a single file",
    );

    let exception = v8::Exception::error(scope, message);
    scope.throw_exception(exception);

    None
}
