use std::{cell::RefCell, rc::Rc, time::Instant};

use crate::{extract::extract_v8_string, result::RunResult};

#[derive(Clone)]
pub struct IsolateState {
    global_context: v8::Global<v8::Context>,
    // handler: v8::Local<'a, v8::Function>,
    // global: v8::Local<'a, v8::Value>,
    // try_catch: v8::TryCatch<'a, v8::HandleScope<'a, v8::Context>>,
    // scope: v8::ContextScope<'a, v8::HandleScope<'a, v8::Context>>,
}

pub struct Isolate {
    isolate: v8::OwnedIsolate,
}

unsafe impl Send for Isolate {}

impl Isolate {
    pub fn new() -> Self {
        let mut isolate = v8::Isolate::new(v8::CreateParams::default());

        let global_context = {
            let scope = &mut v8::HandleScope::new(&mut isolate);
            let context = v8::Context::new(scope);

            v8::Global::new(scope, context)
        };

        isolate.set_slot(Rc::new(RefCell::new(IsolateState {
            // global_context,
            // global,
            // try_catch,
            global_context,
        })));

        Self { isolate }
    }

    pub fn global_realm(&self) -> IsolateState {
        let state = self
            .isolate
            .get_slot::<Rc<RefCell<IsolateState>>>()
            .unwrap();
        let state = state.borrow();
        state.clone()
    }

    pub fn run(&mut self) -> RunResult {
        let state = self.global_realm();
        let scope = &mut v8::HandleScope::with_context(&mut self.isolate, state.global_context);

        let source = v8::String::new(scope, "'hello' + ' world'").unwrap();
        // let origin = bindings::script_origin(scope, name);

        let tc_scope = &mut v8::TryCatch::new(scope);

        let script = v8::Script::compile(tc_scope, source, None);
        // let result = script.run(tc_scope).unwrap();

        if script.is_none() {
            let error = tc_scope.exception().unwrap();
            return RunResult::Error(extract_v8_string(error, tc_scope).unwrap());
        }

        let now = Instant::now();

        match script.unwrap().run(tc_scope) {
            Some(value) => {
                // println!("success: {:?}", extract_v8_string(value, tc_scope));
                RunResult::Response(extract_v8_string(value, tc_scope).unwrap(), now.elapsed())
            }
            None => {
                assert!(tc_scope.has_caught());
                let exception = tc_scope.exception().unwrap();
                // println!("error: {:?}", extract_v8_string(exception, tc_scope));
                // exception_to_err_result(tc_scope, exception, false)

                RunResult::Error(extract_v8_string(exception, tc_scope).unwrap())
            }
        }
    }
}
