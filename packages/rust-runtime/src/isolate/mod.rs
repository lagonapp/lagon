use std::{
    cell::RefCell,
    collections::HashMap,
    rc::Rc,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc, RwLock,
    },
    time::{Duration, Instant},
};

use tokio::{spawn, task::JoinHandle};

use crate::{
    http::{Request, Response, RunResult},
    runtime::get_runtime_code,
    utils::extract_v8_string,
};

mod allocator;
mod bindings;

#[derive(PartialEq)]
enum ExecutionResult {
    WillRun,
    Run,
    MemoryReached,
    TimeoutReached,
}

#[derive(Clone)]
struct GlobalRealm(v8::Global<v8::Context>);

struct IsolateState {
    global: GlobalRealm,
    promises: Vec<JoinHandle<()>>,
}

pub struct IsolateOptions {
    pub code: String,
    pub environment_variables: Option<HashMap<String, String>>,
    pub memory: usize, // in MB (MegaBytes)
    pub timeout: usize, // in ms (MilliSeconds)
                       // pub snapshot_blob: Option<Box<dyn Allocated<[u8]>>>,
}

impl IsolateOptions {
    pub fn new(code: String) -> Self {
        Self {
            code,
            environment_variables: None,
            timeout: 50,
            memory: 128,
            // snapshot_blob: None,
        }
    }

    pub fn with_environment_variables(
        mut self,
        environment_variables: HashMap<String, String>,
    ) -> Self {
        self.environment_variables = Some(environment_variables);
        self
    }

    pub fn with_timeout(mut self, timeout: usize) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn with_memory(mut self, memory: usize) -> Self {
        self.memory = memory;
        self
    }
}

pub struct Isolate {
    options: IsolateOptions,
    isolate: v8::OwnedIsolate,
    handler: Option<v8::Global<v8::Function>>,
    compilation_error: Option<String>,
    count: Arc<AtomicUsize>,
}

unsafe impl Send for Isolate {}

impl Isolate {
    pub fn new(options: IsolateOptions) -> Self {
        let memory_mb = options.memory * 1024 * 1024;
        let count = Arc::new(AtomicUsize::new(options.memory));
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
                promises: Vec::new(),
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        Self {
            options,
            isolate,
            handler: None,
            compilation_error: None,
            count,
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
        let thread_safe_handle = self.isolate.thread_safe_handle();

        let state = self.global_realm();
        let scope = &mut v8::HandleScope::with_context(&mut self.isolate, state.0.clone());
        let try_catch = &mut v8::TryCatch::new(scope);

        if self.handler.is_none() && self.compilation_error.is_none() {
            let code = get_runtime_code(try_catch, &self.options);

            let resource_name = v8::String::new(try_catch, "isolate.js").unwrap();
            let source_map_url = v8::String::new(try_catch, "").unwrap();

            let source = v8::script_compiler::Source::new(
                code,
                Some(&v8::ScriptOrigin::new(
                    try_catch,
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

            match v8::script_compiler::compile_module(try_catch, source) {
                Some(module) => {
                    // TODO: disable imports
                    module
                        .instantiate_module(try_catch, |a, b, c, d| None)
                        .unwrap();
                    module.evaluate(try_catch).unwrap();

                    let namespace = module.get_module_namespace();
                    let namespace = v8::Local::<v8::Object>::try_from(namespace).unwrap();

                    let handler = v8::String::new(try_catch, "masterHandler").unwrap();
                    let handler = namespace.get(try_catch, handler.into()).unwrap();
                    let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
                    let handler = v8::Global::new(try_catch, handler);

                    self.handler = Some(handler);
                }
                None => {
                    match extract_error(try_catch) {
                        RunResult::Error(error) => {
                            self.compilation_error = Some(error);
                        }
                        _ => self.compilation_error = Some("Unkown error".into()),
                    };
                }
            };
        }

        if let Some(error) = &self.compilation_error {
            return RunResult::Error(error.clone());
        }

        let request = request.to_v8_request(try_catch);

        let handler = self.handler.as_ref().unwrap();
        let handler = handler.open(try_catch);

        let global = state.0.open(try_catch);
        let global = global.global(try_catch);

        let terminated = Arc::new(RwLock::new(ExecutionResult::WillRun));
        let terminated_handle = terminated.clone();

        let count_handle = self.count.clone();

        let now = Instant::now();
        let timeout = Duration::from_millis(self.options.timeout as u64);
        let memory = self.options.memory * 1024 * 1024;

        spawn(async move {
            loop {
                let memory_reached = count_handle.load(Ordering::SeqCst) >= memory;
                let timeout_reached = now.elapsed() >= timeout;

                if memory_reached || timeout_reached {
                    // If execution is already done, don't force termination
                    if *terminated_handle.read().unwrap() == ExecutionResult::Run {
                        return;
                    }

                    let mut terminated_handle = terminated_handle.write().unwrap();
                    *terminated_handle = if memory_reached {
                        ExecutionResult::MemoryReached
                    } else {
                        ExecutionResult::TimeoutReached
                    };

                    if !thread_safe_handle.is_execution_terminating() {
                        thread_safe_handle.terminate_execution();
                    }

                    break;
                }
            }
        });

        match handler.call(try_catch, global.into(), &[request.into()]) {
            Some(mut response) => {
                *terminated.write().unwrap() = ExecutionResult::Run;

                if response.is_promise() {
                    let promise = v8::Local::<v8::Promise>::try_from(response).unwrap();
                    // println!("state: {:?}", promise.state());

                    match promise.state() {
                        v8::PromiseState::Pending => {
                            // Should never occur?
                            println!("promise pending")
                        }
                        v8::PromiseState::Fulfilled => {
                            response = promise.result(try_catch);
                        }
                        _ => {}
                    };
                }

                match Response::from_v8_response(try_catch, response) {
                    Some(response) => RunResult::Response(response),
                    None => extract_error(try_catch),
                }
            }
            None => match *terminated.read().unwrap() {
                ExecutionResult::MemoryReached => RunResult::MemoryLimit(),
                ExecutionResult::TimeoutReached => RunResult::Timeout(),
                _ => extract_error(try_catch),
            },
        }
    }
}

fn extract_error(scope: &mut v8::TryCatch<v8::HandleScope>) -> RunResult {
    let exception = scope.exception().unwrap();

    match extract_v8_string(exception, scope) {
        Some(error) => RunResult::Error(error),
        None => {
            let exception_message = v8::Exception::create_message(scope, exception);
            let exception_message = exception_message.get(scope).to_rust_string_lossy(scope);

            RunResult::Error(exception_message)
        }
    }
}
