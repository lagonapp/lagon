use futures::{future::poll_fn, stream::FuturesUnordered, Future, StreamExt};
use lagon_runtime_http::{FromV8, IntoV8, Request, Response, RunResult, StreamResult};
use lagon_runtime_v8_utils::v8_string;
use lazy_static::lazy_static;
use std::{
    cell::RefCell,
    collections::HashMap,
    pin::Pin,
    rc::Rc,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Condvar, Mutex,
    },
    task::{Context, Poll},
    time::{Duration, Instant},
};
use tokio_util::task::LocalPoolHandle;
use v8::MapFnTo;

use self::{
    bindings::{BindingResult, PromiseResult},
    callbacks::{heap_limit_callback, promise_reject_callback, resolve_module_callback},
    options::{IsolateOptions, Metadata},
};

mod bindings;
mod callbacks;
pub mod options;
pub use bindings::CONSOLE_SOURCE;

lazy_static! {
    pub static ref POOL: LocalPoolHandle = LocalPoolHandle::new(1);
}

const RUNTIME_ONLY_SCRIPT_NAME: &str = "runtime.js";
const CODE_ONLY_SCRIPT_NAME: &str = "code.js";
const ISOLATE_SCRIPT_NAME: &str = "isolate.js";

#[derive(Debug, Clone)]
struct Global(v8::Global<v8::Context>);

#[derive(Debug)]
pub struct IsolateState {
    global: Option<Global>,
    promises: FuturesUnordered<Pin<Box<dyn Future<Output = BindingResult>>>>,
    js_promises: HashMap<usize, v8::Global<v8::PromiseResolver>>,
    handler_result: Option<v8::Global<v8::Promise>>,
    stream_sender: flume::Sender<StreamResult>,
    metadata: Rc<Metadata>,
    rejected_promises: HashMap<v8::Global<v8::Promise>, String>,
    lines: usize,
    fetch_calls: usize,
}

#[derive(Debug, Copy, Clone)]
pub struct IsolateStatistics {
    pub cpu_time: Duration,
    pub memory_usage: usize,
}

#[derive(Debug)]
enum StreamStatus {
    None,
    HasStream,
    Done,
}

impl StreamStatus {
    pub fn is_done(&self) -> bool {
        matches!(self, StreamStatus::Done)
    }
}

pub struct Isolate {
    options: IsolateOptions,
    isolate: Option<v8::OwnedIsolate>,
    handler: Option<v8::Global<v8::Function>>,
    compilation_error: Option<String>,
    stream_receiver: flume::Receiver<StreamResult>,
    stream_status: StreamStatus,
    stream_response_sent: bool,
    termination_tx: Option<flume::Sender<RunResult>>,
    termination_rx: Option<flume::Receiver<RunResult>>,
    running_promises: Arc<AtomicBool>,
    wait: Option<Arc<(Mutex<bool>, Condvar)>>,
}

unsafe impl Send for Isolate {}
unsafe impl Sync for Isolate {}

// NOTE
// All tx.send(...) can return an Err due to many reason, e.g the thread panicked
// or the connection closed on the other side, meaning the channel is now closed.
// That's why we use .unwrap_or(()) to silently discard any error.
impl Isolate {
    pub fn new(options: IsolateOptions) -> Self {
        let memory_mb = options.memory * 1024 * 1024;
        let mut params = v8::CreateParams::default().heap_limits(0, memory_mb);

        let references = vec![
            v8::ExternalReference {
                function: bindings::console::console_binding.map_fn_to(),
            },
            v8::ExternalReference {
                function: bindings::pull_stream::pull_stream_binding.map_fn_to(),
            },
            v8::ExternalReference {
                function: bindings::crypto::uuid_binding.map_fn_to(),
            },
            v8::ExternalReference {
                function: bindings::crypto::random_values_binding.map_fn_to(),
            },
            v8::ExternalReference {
                function: bindings::crypto::get_key_value_binding.map_fn_to(),
            },
            v8::ExternalReference {
                function: bindings::queue_microtask::queue_microtask_binding.map_fn_to(),
            },
        ];

        let refs = v8::ExternalReferences::new(&references);
        std::mem::forget(references);
        let refs: &'static v8::ExternalReferences = Box::leak(Box::new(refs));

        let mut isolate = match options.snapshot {
            true => v8::Isolate::snapshot_creator(Some(refs)),
            false => {
                if let Some(snapshot_blob) = options.snapshot_blob {
                    params = params
                        .external_references(&**refs)
                        .snapshot_blob(snapshot_blob);
                }

                v8::Isolate::new(params)
            }
        };

        isolate.set_capture_stack_trace_for_uncaught_exceptions(true, 4);
        isolate.set_promise_reject_callback(promise_reject_callback);

        let (stream_sender, stream_receiver) = flume::unbounded();

        let state: IsolateState = {
            let isolate_scope = &mut v8::HandleScope::new(&mut isolate);
            let global = if options.snapshot {
                let context = bindings::bind(isolate_scope, bindings::BindStrategy::Sync);
                let global = v8::Global::new(isolate_scope, context);
                isolate_scope.set_default_context(context);
                global
            } else if options.snapshot_blob.is_some() {
                let context = bindings::bind(isolate_scope, bindings::BindStrategy::Async);
                v8::Global::new(isolate_scope, context)
            } else {
                let context = bindings::bind(isolate_scope, bindings::BindStrategy::All);
                v8::Global::new(isolate_scope, context)
            };

            IsolateState {
                global: Some(Global(global)),
                promises: FuturesUnordered::new(),
                js_promises: HashMap::new(),
                handler_result: None,
                stream_sender,
                metadata: Rc::clone(&options.metadata),
                rejected_promises: HashMap::new(),
                lines: 0,
                fetch_calls: 0,
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        let mut this = Self {
            options,
            isolate: Some(isolate),
            handler: None,
            compilation_error: None,
            stream_receiver,
            stream_status: StreamStatus::None,
            stream_response_sent: false,
            termination_tx: None,
            termination_rx: None,
            running_promises: Arc::new(AtomicBool::new(false)),
            wait: None,
        };

        let isolate_ptr = &mut this as *mut _ as *mut std::ffi::c_void;
        this.isolate
            .as_mut()
            .unwrap()
            .add_near_heap_limit_callback(heap_limit_callback, isolate_ptr);

        this
    }

    pub fn get_metadata(&self) -> Rc<Metadata> {
        Rc::clone(&self.options.metadata)
    }

    fn terminate(&mut self) {
        if let Some(isolate) = &self.isolate {
            if !isolate.is_execution_terminating() {
                isolate.terminate_execution();
            }
        }
    }

    pub(self) fn state(isolate: &v8::Isolate) -> Rc<RefCell<IsolateState>> {
        let s = isolate.get_slot::<Rc<RefCell<IsolateState>>>().unwrap();
        s.clone()
    }

    fn evaluate(&mut self, request: Request) -> Option<String> {
        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());

        // Reset the stream status after each `run()`
        self.stream_status = StreamStatus::None;
        self.stream_response_sent = false;

        let global = {
            let state = isolate_state.borrow();
            state.global.as_ref().unwrap().0.clone()
        };

        let scope =
            &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global.clone());
        let try_catch = &mut v8::TryCatch::new(scope);

        if self.handler.is_none() && self.compilation_error.is_none() {
            let (code, lines) = self.options.get_runtime_code(try_catch);
            let resource_name = v8_string(
                try_catch,
                if self.options.snapshot {
                    RUNTIME_ONLY_SCRIPT_NAME
                } else if self.options.snapshot_blob.is_some() {
                    CODE_ONLY_SCRIPT_NAME
                } else {
                    ISOLATE_SCRIPT_NAME
                },
            );
            let source_map_url = v8_string(try_catch, "");

            isolate_state.borrow_mut().lines = lines;

            let source = v8::script_compiler::Source::new(
                code,
                Some(&v8::ScriptOrigin::new(
                    try_catch,
                    resource_name.into(),
                    0,
                    0,
                    false,
                    i32::from(self.options.snapshot_blob.is_some()),
                    source_map_url.into(),
                    false,
                    false,
                    true,
                )),
            );

            match v8::script_compiler::compile_module(try_catch, source) {
                Some(module) => {
                    if module
                        .instantiate_module(try_catch, resolve_module_callback)
                        .is_none()
                    {
                        return Some(handle_error(try_catch, lines).as_error());
                    }

                    module.evaluate(try_catch)?;

                    if !self.options.snapshot {
                        let global = global.open(try_catch);
                        let global = global.global(try_catch);
                        let handler_key = v8_string(try_catch, "masterHandler");
                        let handler = global.get(try_catch, handler_key.into()).unwrap();
                        let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
                        let handler = v8::Global::new(try_catch, handler);

                        self.handler = Some(handler);
                    }
                }
                None => return Some(handle_error(try_catch, lines).as_error()),
            };
        }

        if self.options.snapshot {
            return None;
        }

        let request = request.into_v8(try_catch);

        let handler = self.handler.as_ref().unwrap();
        let handler = handler.open(try_catch);

        let global = global.open(try_catch);
        let global = global.global(try_catch);

        {
            let mut state = isolate_state.borrow_mut();
            state.handler_result = None;
            state.rejected_promises.clear();
            state.fetch_calls = 0;
        }

        match handler.call(try_catch, global.into(), &[request.into()]) {
            Some(response) => {
                let promise = v8::Local::<v8::Promise>::try_from(response)
                    .expect("Handler did not return a promise");
                let promise = v8::Global::new(try_catch, promise);

                isolate_state.borrow_mut().handler_result = Some(promise);
            }
            None => {
                let mut run_result = match try_catch.is_execution_terminating() {
                    true => RunResult::MemoryLimit,
                    false => handle_error(try_catch, 0),
                };

                if let Ok(prev_run_result) = self.termination_rx.as_ref().unwrap().try_recv() {
                    run_result = prev_run_result;
                }

                self.termination_tx
                    .as_ref()
                    .unwrap()
                    .send(run_result)
                    .unwrap_or(());
            }
        };

        None
    }

    fn poll_v8(&mut self) {
        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let global = {
            let isolate_state = isolate_state.borrow();
            isolate_state.global.as_ref().unwrap().0.clone()
        };
        let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);

        while v8::Platform::pump_message_loop(&v8::V8::get_current_platform(), scope, false) {}
        scope.perform_microtask_checkpoint();
    }

    fn resolve_promises(&mut self, cx: &mut Context) {
        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let mut promises = None;

        {
            let mut isolate_state = isolate_state.borrow_mut();

            if !isolate_state.promises.is_empty() {
                promises = Some(Vec::new());

                self.running_promises.store(true, Ordering::SeqCst);
                let condvar = &self.wait.as_ref().unwrap().1;
                condvar.notify_one();

                while let Poll::Ready(Some(BindingResult { id, result })) =
                    isolate_state.promises.poll_next_unpin(cx)
                {
                    let promise = isolate_state
                        .js_promises
                        .remove(&id)
                        .unwrap_or_else(|| panic!("JS promise {id} not found"));

                    promises.as_mut().unwrap().push((result, promise));
                }

                self.running_promises.store(false, Ordering::SeqCst);
                condvar.notify_one();
            }
        }

        if let Some(promises) = promises {
            let global = {
                let isolate_state = isolate_state.borrow();
                isolate_state.global.as_ref().unwrap().0.clone()
            };
            let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);

            for (result, promise) in promises {
                let promise = promise.open(scope);
                let should_reject = matches!(result, PromiseResult::Error(_));
                let value = result.into_value(scope);

                if should_reject {
                    promise.reject(scope, value);
                } else {
                    promise.resolve(scope, value);
                }
            }
        }
    }

    fn poll_stream(&mut self, tx: &flume::Sender<RunResult>) {
        while let Ok(stream_result) = self.stream_receiver.try_recv() {
            // Set that we are streaming if it's the first time
            // we receive a stream event
            if let StreamStatus::None = self.stream_status {
                self.stream_status = StreamStatus::HasStream;
            }

            if let StreamResult::Done = stream_result {
                self.stream_status = StreamStatus::Done;
            }

            tx.send(RunResult::Stream(stream_result)).unwrap_or(());
        }
    }

    fn poll_event_loop(&mut self, cx: &mut Context, tx: &flume::Sender<RunResult>) -> Poll<()> {
        self.poll_v8();
        self.resolve_promises(cx);
        self.poll_stream(tx);

        // Handle termination results like timeouts and memory limit before
        // checking the streaming status and promise state.
        if let Ok(run_result) = self.termination_rx.as_ref().unwrap().try_recv() {
            tx.send(run_result).unwrap_or(());
            return Poll::Ready(());
        }

        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let mut state = isolate_state.borrow_mut();

        if !state.rejected_promises.is_empty() {
            let key = state.rejected_promises.keys().next().unwrap().clone();
            let content = state.rejected_promises.remove(&key).unwrap();

            tx.send(RunResult::Error(content)).unwrap_or(());
            return Poll::Ready(());
        }

        if self.stream_response_sent {
            if self.stream_status.is_done() {
                return Poll::Ready(());
            }

            cx.waker().wake_by_ref();
            return Poll::Pending;
        }

        let global = state.global.as_ref().unwrap().0.clone();
        let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);
        let try_catch = &mut v8::TryCatch::new(scope);

        if let Some(promise) = state.handler_result.as_ref() {
            let promise = promise.open(try_catch);

            match promise.state() {
                v8::PromiseState::Fulfilled => {
                    let response = promise.result(try_catch);

                    let run_result = match Response::from_v8(try_catch, response) {
                        Ok(response) => RunResult::Response(response),
                        Err(error) => RunResult::Error(error.to_string()),
                    };

                    if let RunResult::Response(ref response) = run_result {
                        if response.is_streamed() {
                            if !self.stream_response_sent {
                                tx.send(RunResult::Stream(StreamResult::Start(response.clone())))
                                    .unwrap_or(());
                            }

                            self.stream_response_sent = true;

                            return if self.stream_status.is_done() {
                                Poll::Ready(())
                            } else {
                                cx.waker().wake_by_ref();
                                Poll::Pending
                            };
                        }
                    }

                    tx.send(run_result).unwrap_or(());
                    return Poll::Ready(());
                }
                v8::PromiseState::Rejected => {
                    let exception = promise.result(try_catch);

                    tx.send(RunResult::Error(get_exception_message(
                        try_catch,
                        exception,
                        state.lines,
                    )))
                    .unwrap_or(());
                    return Poll::Ready(());
                }
                v8::PromiseState::Pending => {}
            };
        }

        cx.waker().wake_by_ref();
        Poll::Pending
    }

    async fn run_event_loop(&mut self, tx: &flume::Sender<RunResult>) {
        poll_fn(|cx| self.poll_event_loop(cx, tx)).await;
    }

    fn check_for_compilation_error(&self, tx: &flume::Sender<RunResult>) -> bool {
        if let Some(compilation_error) = &self.compilation_error {
            tx.send(RunResult::Error(compilation_error.to_string()))
                .unwrap_or(());

            return true;
        }

        false
    }

    pub async fn run(&mut self, request: Request, tx: flume::Sender<RunResult>) {
        // We might have a compilation error from the initial evaluate call
        if self.check_for_compilation_error(&tx) {
            return;
        }

        let thread_safe_handle = self.isolate.as_ref().unwrap().thread_safe_handle();

        let now = Instant::now();
        // Script parsing may take a long time, so we use the startup_timeout
        // when the isolate has not been used yet.
        let timeout = match self.handler.is_none() && self.compilation_error.is_none() {
            true => self.options.startup_timeout,
            false => self.options.timeout,
        };
        let (termination_tx, termination_rx) = flume::bounded(1);

        self.termination_tx = Some(termination_tx.clone());
        self.termination_rx = Some(termination_rx);
        self.wait = Some(Arc::new((Mutex::new(true), Condvar::new())));

        let running_promises_handle = Arc::clone(&self.running_promises);
        let wait_handle = Arc::clone(self.wait.as_ref().unwrap());

        POOL.spawn_pinned(move || async move {
            let (running, condition) = &*wait_handle;

            let timer = condition
                .wait_timeout_while(running.lock().unwrap(), timeout, |running| {
                    *running && !running_promises_handle.load(Ordering::SeqCst)
                })
                .unwrap();

            if timer.1.timed_out() && !thread_safe_handle.is_execution_terminating() {
                termination_tx.send(RunResult::Timeout).unwrap_or(());
                thread_safe_handle.terminate_execution();
            }
        });

        self.compilation_error = self.evaluate(request);

        // We can also have a compilation error when calling this function
        // for the first time
        if self.check_for_compilation_error(&tx) {
            return;
        }

        self.run_event_loop(&tx).await;

        let (running, condvar) = &**self.wait.as_ref().unwrap();
        *running.lock().unwrap() = false;
        condvar.notify_one();

        if let Some(on_isolate_statistics) = &self.options.on_statistics {
            let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
            let state = isolate_state.borrow();
            let global = state.global.as_ref().unwrap().0.clone();
            let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);

            let mut heap_statistics = v8::HeapStatistics::default();
            scope.get_heap_statistics(&mut heap_statistics);

            let statistics = IsolateStatistics {
                cpu_time: now.elapsed(),
                memory_usage: heap_statistics.used_heap_size(),
            };

            on_isolate_statistics(Rc::clone(&self.options.metadata), statistics);
        }
    }

    pub fn snapshot(&mut self) -> v8::StartupData {
        self.evaluate(Request::default());

        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let mut state = isolate_state.borrow_mut();

        state.promises.clear();
        state.js_promises.clear();
        state.global.take();

        self.isolate
            .take()
            .unwrap()
            .create_blob(v8::FunctionCodeHandling::Keep)
            .unwrap()
    }
}

impl Drop for Isolate {
    fn drop(&mut self) {
        self.terminate();

        if let Some(on_drop) = &self.options.on_drop {
            on_drop(Rc::clone(&self.options.metadata));
        }
    }
}

pub fn get_exception_message(
    scope: &mut v8::TryCatch<v8::HandleScope>,
    exception: v8::Local<v8::Value>,
    lines: usize,
) -> String {
    let exception_message = v8::Exception::create_message(scope, exception);
    let message = exception_message.get(scope).to_rust_string_lossy(scope);

    if let Some(stack_trace) = exception_message.get_stack_trace(scope) {
        let frames = stack_trace.get_frame_count();
        let mut formatted = String::new();

        for i in 0..frames {
            if let Some(frame) = stack_trace.get_frame(scope, i) {
                let script_name = frame
                    .get_script_name(scope)
                    .unwrap()
                    .to_rust_string_lossy(scope);

                // Skip script containg JS runtime, used when generating the snapshot blob
                if script_name == RUNTIME_ONLY_SCRIPT_NAME || lines > frame.get_line_number() {
                    continue;
                }

                let location =
                    format!("{}:{}", frame.get_line_number() - lines, frame.get_column());

                let frame = if let Some(function_name) = frame.get_function_name(scope) {
                    format!(
                        "\n  at {} ({})",
                        function_name.to_rust_string_lossy(scope),
                        location,
                    )
                } else {
                    format!("\n  at {location}")
                };

                formatted.push_str(&frame);
            }
        }

        return format!("{message}{formatted}");
    }

    if let Some(line) = exception_message.get_source_line(scope) {
        return format!("{}, at:\n{}", message, line.to_rust_string_lossy(scope),);
    }

    message
}

fn handle_error(scope: &mut v8::TryCatch<v8::HandleScope>, lines: usize) -> RunResult {
    if let Some(exception) = scope.exception() {
        return RunResult::Error(get_exception_message(scope, exception, lines));
    }

    RunResult::Error("Unknown error".into())
}
