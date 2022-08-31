use std::{
    cell::RefCell,
    collections::HashMap,
    rc::Rc,
    sync::{atomic::AtomicUsize, Arc},
    time::Instant,
};

use tokio::task::JoinHandle;

use crate::{
    http::{Request, Response, RunResult},
    utils::extract_v8_string,
};

mod allocator;
mod bindings;

static JS_RUNTIME: &str = include_str!("../../js/runtime.js");

#[derive(Clone)]
struct GlobalRealm(v8::Global<v8::Context>);

struct IsolateState {
    global: GlobalRealm,
    // promises: HashMap<JoinHandle<()>, v8::Global<v8::PromiseResolver>>,
    // promises: HashMap<Box<dyn Future<Output = ()>>, v8::Global<v8::PromiseResolver>>,
    promises: Vec<JoinHandle<()>>,
}

pub struct IsolateOptions {
    pub code: String,
    pub timeout: u64,
    pub memory_limit: usize,
    // pub snapshot_blob: Option<Box<dyn Allocated<[u8]>>>,
}

impl IsolateOptions {
    pub fn default(code: String) -> Self {
        Self {
            code,
            timeout: 50, // 50ms
            memory_limit: 128, // 128MB
                         // snapshot_blob: None,
        }
    }
}

pub struct Isolate {
    options: IsolateOptions,
    isolate: v8::OwnedIsolate,
    handler: Option<v8::Global<v8::Function>>,
}

unsafe impl Send for Isolate {}

impl Isolate {
    pub fn new(options: IsolateOptions) -> Self {
        let memory_mb = options.memory_limit * 1024 * 1024;
        let count = Arc::new(AtomicUsize::new(options.memory_limit));
        let array_buffer_allocator = allocator::create_allocator(count.clone());

        let params = v8::CreateParams::default()
            .heap_limits(0, memory_mb)
            .array_buffer_allocator(array_buffer_allocator);

        // TODO
        // if let Some(snapshot_blob) = self.options.snapshot_blob {
        //     params = params.snapshot_blob(snapshot_blob.as_mut());
        // }

        let mut isolate = v8::Isolate::new(params);

        let state = {
            let isolate_scope = &mut v8::HandleScope::new(&mut isolate);
            let global = bindings::bind(isolate_scope);

            IsolateState {
                global: GlobalRealm(global),
                // promises: HashMap::new(),
                promises: Vec::new(),
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        Self {
            options,
            isolate,
            handler: None,
        }
    }

    pub(crate) fn state(isolate: &v8::Isolate) -> Rc<RefCell<IsolateState>> {
        let s = isolate.get_slot::<Rc<RefCell<IsolateState>>>().unwrap();
        s.clone()
      }

    pub(crate) fn global_realm(&self) -> GlobalRealm {
        let state = self
            .isolate
            .get_slot::<Rc<RefCell<IsolateState>>>()
            .unwrap();
        let state = state.borrow();
        state.global.clone()
    }

    pub fn run(&mut self, request: Request) -> RunResult {
        let state = self.global_realm();
        let scope = &mut v8::HandleScope::with_context(&mut self.isolate, state.0.clone());

        if self.handler.is_none() {
            let code = &self.options.code;
            let code = v8::String::new(
                scope,
                &format!(
                    r#"
{JS_RUNTIME}

{code}

export async function masterHandler(request) {{
  const handlerRequest = new Request(request.input, {{
      method: request.method,
      headers: request.headers,
      body: request.body,
  }});

  return handler(handlerRequest)
}}"#
                ),
            )
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

            let handler = v8::String::new(scope, "masterHandler").unwrap();
            let handler = namespace.get(scope, handler.into()).unwrap();
            let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
            let handler = v8::Global::new(scope, handler);

            self.handler = Some(handler);
        }

        let request_param = v8::Object::new(scope);

        let input_key = v8::String::new(scope, "input").unwrap();
        let input_key = v8::Local::new(scope, input_key);
        let input_value = v8::String::new(scope, "TODO").unwrap();
        let input_value = v8::Local::new(scope, input_value);
        request_param
            .set(scope, input_key.into(), input_value.into())
            .unwrap();

        let method_key = v8::String::new(scope, "method").unwrap();
        let method_key = v8::Local::new(scope, method_key);
        let method_value = v8::String::new(scope, request.method.into()).unwrap();
        let method_value = v8::Local::new(scope, method_value);
        request_param
            .set(scope, method_key.into(), method_value.into())
            .unwrap();

        let body_key = v8::String::new(scope, "body").unwrap();
        let body_key = v8::Local::new(scope, body_key);
        let body_value = v8::String::new(scope, &request.body).unwrap();
        let body_value = v8::Local::new(scope, body_value);
        request_param
            .set(scope, body_key.into(), body_value.into())
            .unwrap();

        let headers_key = v8::String::new(scope, "headers").unwrap();
        let headers_key = v8::Local::new(scope, headers_key);

        let request_headers = v8::Object::new(scope);

        for (key, value) in request.headers.iter() {
            let key = v8::String::new(scope, key).unwrap();
            let key = v8::Local::new(scope, key);
            let value = v8::String::new(scope, value).unwrap();
            let value = v8::Local::new(scope, value);
            request_headers.set(scope, key.into(), value.into());
        }

        request_param
            .set(scope, headers_key.into(), request_headers.into())
            .unwrap();

        let handler = self.handler.as_ref().unwrap();
        let handler = handler.open(scope);

        let global = state.0.open(scope);
        let try_catch = &mut v8::TryCatch::new(scope);
        let global = global.global(try_catch);

        let now = Instant::now();

       match handler.call(try_catch, global.into(), &[request_param.into()]) {
            Some(mut response) => {
                if response.is_promise() {
                    let promise = v8::Local::<v8::Promise>::try_from(response).unwrap();
                    println!("state: {:?}", promise.state());

                    match promise.state() {
                        v8::PromiseState::Pending => {
                            // Should never occur?
                            println!("promise pending")
                        }
                        v8::PromiseState::Fulfilled => {
                            response = promise.result(try_catch);
                        }
                        v8::PromiseState::Rejected => {
                            println!("promise rejected")
                        }
                    };
                }

                let response = response.to_object(try_catch).unwrap();

                let body_key = v8::String::new(try_catch, "body").unwrap();
                let body_key = v8::Local::new(try_catch, body_key);
                let body = response.get(try_catch, body_key.into()).unwrap();
                let body = extract_v8_string(body, try_catch).unwrap();

                let headers_key = v8::String::new(try_catch, "headers").unwrap();
                let headers_key = v8::Local::new(try_catch, headers_key);
                let headers_object = response
                    .get(try_catch, headers_key.into())
                    .unwrap()
                    .to_object(try_catch)
                    .unwrap();
                let headers_map = headers_object.get(try_catch, headers_key.into()).unwrap();
                let headers_map = unsafe { v8::Local::<v8::Map>::cast(headers_map) };

                let mut headers = None;

                if headers_map.size() > 0 {
                    let mut final_headers = HashMap::new();

                    let headers_keys = headers_map.as_array(try_catch);

                    for mut index in 0..headers_keys.length() {
                        if index % 2 != 0 {
                            continue;
                        }

                        let key = headers_keys
                            .get_index(try_catch, index)
                            .unwrap()
                            .to_rust_string_lossy(try_catch);
                        index += 1;
                        let value = headers_keys
                            .get_index(try_catch, index)
                            .unwrap()
                            .to_rust_string_lossy(try_catch);

                        final_headers.insert(key, value);
                    }

                    headers = Some(final_headers);
                }

                let status_key = v8::String::new(try_catch, "status").unwrap();
                let status_key = v8::Local::new(try_catch, status_key);
                let status = response
                    .get(try_catch, status_key.into())
                    .unwrap()
                    .integer_value(try_catch)
                    .unwrap() as u16;

                RunResult::Response(
                    Response {
                        headers,
                        body,
                        status,
                    },
                    now.elapsed(),
                )
            }
            None => {
                let exception = try_catch.exception().unwrap();

                match extract_v8_string(exception, try_catch) {
                    Some(error) => RunResult::Error(error),
                    // Can be caused by memory limit being reached, or maybe by something else?
                    None => {
                        let exception_message = v8::Exception::create_message(try_catch, exception);
                        let exception_message = exception_message
                            .get(try_catch)
                            .to_rust_string_lossy(try_catch);

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
