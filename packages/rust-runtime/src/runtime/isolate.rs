use std::{cell::RefCell, rc::Rc, time::Instant};

use crate::{extract::extract_v8_string, result::RunResult, http::{Request, Response}};

#[derive(Clone)]
pub struct IsolateState {
    global_context: v8::Global<v8::Context>,
}

pub struct Isolate {
    isolate: v8::OwnedIsolate,
    handler: Option<v8::Global<v8::Function>>,
}

unsafe impl Send for Isolate {}

impl Isolate {
    pub fn new() -> Self {
        let mut isolate = v8::Isolate::new(v8::CreateParams::default());

        let state = {
            let scope = &mut v8::HandleScope::new(&mut isolate);
            let context = v8::Context::new(scope);

            let global = v8::Global::new(scope, context);

            IsolateState {
                global_context: global,
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        Self {
            isolate,
            handler: None,
        }
    }

    pub fn global_realm(&self) -> IsolateState {
        let state = self
            .isolate
            .get_slot::<Rc<RefCell<IsolateState>>>()
            .unwrap();
        let state = state.borrow();
        state.clone()
    }

    pub fn run(&mut self, request: Request) -> RunResult {
        let state = self.global_realm();
        let scope =
            &mut v8::HandleScope::with_context(&mut self.isolate, state.global_context.clone());

        if self.handler.is_none() {
            let code = v8::String::new(scope, "export function handler() { return 'hello world' }")
                .unwrap();
            let resource_name = v8::String::new(scope, "isolate.js").unwrap();
            let source_map_url = v8::String::new(scope, "").unwrap();

            let source = v8::script_compiler::Source::new(
                code,
                Some(&v8::ScriptOrigin::new(
                    scope,
                    resource_name.into(),
                    0,
                    0,
                    false,
                    0,
                    source_map_url.into(),
                    false,
                    false,
                    true,
                )),
            );

            let module = v8::script_compiler::compile_module(scope, source).unwrap();
            // TODO: disable imports
            module.instantiate_module(scope, |a, b, c, d| None).unwrap();
            module.evaluate(scope).unwrap();

            let namespace = module.get_module_namespace();
            let namespace = v8::Local::<v8::Object>::try_from(namespace).unwrap();

            let handler = v8::String::new(scope, "handler").unwrap();
            let handler = namespace.get(scope, handler.into()).unwrap();
            let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
            let handler = v8::Global::new(scope, handler);

            self.handler = Some(handler);
        }

        let handler = self.handler.as_ref().unwrap();
        let handler = handler.open(scope);

        let global = state.global_context.open(scope);
        let try_catch = &mut v8::TryCatch::new(scope);
        let global = global.global(try_catch);

        let now = Instant::now();

        match handler.call(try_catch, global.into(), &[]) {
            Some(result) => {
                let response = extract_v8_string(result, try_catch).unwrap();

                RunResult::Response(Response {
                    headers: None,
                    body: response,
                    status: 200,
                }, now.elapsed())
            }
            None => {
                let exception = try_catch.exception().unwrap();

                match extract_v8_string(exception, try_catch) {
                    Some(error) => RunResult::Error(error),
                    // Can be caused by memory limit being reached, or maybe by something else?
                    None => {
                        let exception_message = v8::Exception::create_message(try_catch, exception);
                        let exception_message = exception_message.get(try_catch).to_rust_string_lossy(try_catch);

                        // if count.load(Ordering::SeqCst) >= memory_mb {
                        //     RunResult::MemoryLimit()
                        // } else {
                        // println!("{:?}", exception.to_object(try_catch).unwrap().get_property_names(try_catch).unwrap());
                        RunResult::Error(exception_message)
                        // }
                    }
                }
            }
        }
    }
}
