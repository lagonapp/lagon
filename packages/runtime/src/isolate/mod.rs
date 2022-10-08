use std::{
    cell::RefCell,
    collections::HashMap,
    pin::Pin,
    rc::Rc,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc, RwLock,
    },
    task::{Context, Poll},
    time::{Duration, Instant},
};

use futures::{future::poll_fn, stream::FuturesUnordered, Future, StreamExt};
use tokio::spawn;
use v8::PromiseState;

use crate::{
    http::{FromV8, IntoV8, Request, Response, RunResult},
    runtime::get_runtime_code,
    utils::extract_v8_string,
};

use self::bindings::{BindingResult, PromiseResult};

mod allocator;
mod bindings;

#[derive(Debug, PartialEq)]
enum ExecutionResult {
    WillRun,
    Run,
    MemoryReached,
    TimeoutReached,
}

#[derive(Debug, Clone)]
struct GlobalRealm(v8::Global<v8::Context>);

#[derive(Debug)]
struct HandlerResult {
    promise: v8::Global<v8::Promise>,
    sender: flume::Sender<(RunResult, Option<IsolateStatistics>)>,
    statistics: IsolateStatistics,
}

#[derive(Debug)]
struct TerminationResult {
    sender: flume::Sender<(RunResult, Option<IsolateStatistics>)>,
    run_result: RunResult,
}

#[derive(Debug)]
struct IsolateState {
    global: GlobalRealm,
    promises: FuturesUnordered<Pin<Box<dyn Future<Output = BindingResult>>>>,
    js_promises: HashMap<usize, v8::Global<v8::PromiseResolver>>,
    handler_result: Option<HandlerResult>,
    termination_result: Option<TerminationResult>,
}

#[derive(Debug, Copy, Clone)]
pub struct IsolateStatistics {
    pub cpu_time: Duration,
    pub memory_usage: usize,
}

#[derive(Debug)]
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
                promises: FuturesUnordered::new(),
                js_promises: HashMap::new(),
                handler_result: None,
                termination_result: None,
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

    pub(self) fn state(isolate: &v8::Isolate) -> Rc<RefCell<IsolateState>> {
        let s = isolate.get_slot::<Rc<RefCell<IsolateState>>>().unwrap();
        s.clone()
    }

    pub fn evaluate(
        &mut self,
        request: Request,
    ) -> flume::Receiver<(RunResult, Option<IsolateStatistics>)> {
        let (sender, receiver) = flume::bounded(1);
        let thread_safe_handle = self.isolate.thread_safe_handle();

        let initial_isolate_state = Isolate::state(&self.isolate);
        let isolate_state = initial_isolate_state.borrow();
        let state = isolate_state.global.clone();

        let scope = &mut v8::HandleScope::with_context(&mut self.isolate, state.0.clone());
        let try_catch = &mut v8::TryCatch::new(scope);

        if self.handler.is_none() && self.compilation_error.is_none() {
            let code = match get_runtime_code(try_catch, &self.options) {
                Some(code) => code,
                None => {
                    self.compilation_error = Some("Failed to get runtime code".to_string());
                    sender
                        .send((
                            RunResult::Error(self.compilation_error.clone().unwrap()),
                            None,
                        ))
                        .unwrap();
                    return receiver;
                }
            };

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
                        .instantiate_module(try_catch, |_a, _b, _c, _d| None)
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
                    match handle_error(try_catch) {
                        RunResult::Error(error) => self.compilation_error = Some(error),
                        _ => self.compilation_error = Some("Unkown error".into()),
                    };
                }
            };
        }

        if let Some(error) = &self.compilation_error {
            sender
                .send((RunResult::Error(error.clone()), None))
                .unwrap();
            return receiver;
        }

        let request = request.into_v8(try_catch);

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
                // // If execution is already done, don't force termination
                if *terminated_handle.read().unwrap() == ExecutionResult::Run {
                    break;
                }

                let memory_reached = count_handle.load(Ordering::SeqCst) >= memory;
                let timeout_reached = now.elapsed() >= timeout;

                if memory_reached || timeout_reached {
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

        drop(isolate_state);

        match handler.call(try_catch, global.into(), &[request.into()]) {
            Some(response) => {
                *terminated.write().unwrap() = ExecutionResult::Run;

                let promise = v8::Local::<v8::Promise>::try_from(response)
                    .expect("Handler did not return a promise");
                let promise = v8::Global::new(try_catch, promise);

                let cpu_time = now.elapsed();
                let memory_usage = self.count.load(Ordering::SeqCst);

                // let mut heap_statistics = v8::HeapStatistics::default();
                // try_catch.get_heap_statistics(&mut heap_statistics);
                // println!("count: {} used heap size: {}", self.count.load(Ordering::SeqCst), heap_statistics.used_heap_size());
                let statistics = IsolateStatistics {
                    cpu_time,
                    memory_usage,
                };

                let mut isolate_state = initial_isolate_state.borrow_mut();
                isolate_state.handler_result = Some(HandlerResult {
                    promise,
                    sender,
                    statistics,
                });
            }
            None => {
                let run_result = match *terminated.read().unwrap() {
                    ExecutionResult::MemoryReached => RunResult::MemoryLimit(),
                    ExecutionResult::TimeoutReached => RunResult::Timeout(),
                    _ => handle_error(try_catch),
                };

                let mut isolate_state = initial_isolate_state.borrow_mut();
                isolate_state.termination_result = Some(TerminationResult { sender, run_result });
            }
        };

        receiver
    }

    async fn run_event_loop(&mut self) {
        poll_fn(|cx| self.poll_event_loop(cx)).await;
    }

    fn poll_event_loop(&mut self, cx: &mut Context) -> Poll<()> {
        let isolate_state = Isolate::state(&self.isolate);
        let mut isolate_state = isolate_state.borrow_mut();
        let realm = isolate_state.global.clone();
        let scope = &mut v8::HandleScope::with_context(&mut self.isolate, realm.0);

        while v8::Platform::pump_message_loop(&v8::V8::get_current_platform(), scope, false) {}
        scope.perform_microtask_checkpoint();

        if !isolate_state.promises.is_empty() {
            while let Poll::Ready(Some(BindingResult { id, result })) =
                isolate_state.promises.poll_next_unpin(cx)
            {
                let promise = isolate_state
                    .js_promises
                    .remove(&id)
                    .unwrap_or_else(|| panic!("JS promise {} not found", id));
                let promise = promise.open(scope);

                match result {
                    PromiseResult::Response(response) => {
                        let response = response.into_v8(scope);
                        promise.resolve(scope, response.into());
                    }
                };
            }
        }

        let try_catch = &mut v8::TryCatch::new(scope);

        if let Some(TerminationResult { sender, run_result }) =
            isolate_state.termination_result.take()
        {
            sender.send((run_result, None)).unwrap();
            return Poll::Ready(());
        }

        if let Some(HandlerResult {
            promise,
            sender,
            statistics,
        }) = isolate_state.handler_result.as_ref()
        {
            let promise = promise.open(try_catch);

            match promise.state() {
                PromiseState::Fulfilled => {
                    let response = promise.result(try_catch);
                    let result = match Response::from_v8(try_catch, response) {
                        Some(response) => (RunResult::Response(response), Some(*statistics)),
                        None => (handle_error(try_catch), Some(*statistics)),
                    };

                    sender.send(result).unwrap();
                    return Poll::Ready(());
                }
                PromiseState::Rejected => {
                    let exception = promise.result(try_catch);

                    sender
                        .send((
                            RunResult::Error(get_exception_message(try_catch, exception)),
                            None,
                        ))
                        .unwrap();
                    return Poll::Ready(());
                }
                PromiseState::Pending => {}
            };
        }

        cx.waker().wake_by_ref();
        Poll::Pending
    }

    pub async fn run(&mut self, request: Request) -> (RunResult, Option<IsolateStatistics>) {
        let receiver = self.evaluate(request);
        self.run_event_loop().await;

        receiver.recv_async().await.unwrap()
    }
}

fn get_exception_message(
    scope: &mut v8::TryCatch<v8::HandleScope>,
    exception: v8::Local<v8::Value>,
) -> String {
    let exception_message = v8::Exception::create_message(scope, exception);

    exception_message.get(scope).to_rust_string_lossy(scope)
}

fn handle_error(scope: &mut v8::TryCatch<v8::HandleScope>) -> RunResult {
    let exception = scope.exception().unwrap();

    match extract_v8_string(exception, scope) {
        Some(error) => RunResult::Error(error),
        None => RunResult::Error(get_exception_message(scope, exception)),
    }
}
