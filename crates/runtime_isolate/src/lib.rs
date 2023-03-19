use futures::{future::poll_fn, stream::FuturesUnordered, Future, StreamExt};
use lagon_runtime_http::{FromV8, IntoV8, Request, Response, RunResult, StreamResult};
use lagon_runtime_v8_utils::v8_string;
use lazy_static::lazy_static;
use linked_hash_map::LinkedHashMap;
use std::{
    cell::{RefCell, RefMut},
    collections::HashMap,
    pin::Pin,
    rc::Rc,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    task::{Context, Poll},
    time::Duration,
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

#[derive(Debug, Default)]
pub struct RequestContext {
    fetch_calls: usize,
}

pub struct IsolateRequest {
    pub request: Request,
    pub sender: flume::Sender<RunResult>,
}

#[derive(Debug)]
pub struct HandlerResult {
    promise: v8::Global<v8::Promise>,
    sender: flume::Sender<RunResult>,
    stream_response_sent: RefCell<bool>,
    stream_status: RefCell<StreamStatus>,
    context: RequestContext,
}

#[derive(Debug, Clone)]
struct Global(v8::Global<v8::Context>);

#[derive(Debug)]
pub struct IsolateState {
    global: Option<Global>,
    promises: FuturesUnordered<Pin<Box<dyn Future<Output = BindingResult>>>>,
    js_promises: HashMap<usize, v8::Global<v8::PromiseResolver>>,
    handler_results: HashMap<u32, HandlerResult>,
    stream_sender: flume::Sender<(u32, StreamResult)>,
    metadata: Rc<Metadata>,
    rejected_promises: LinkedHashMap<v8::Global<v8::Promise>, String>,
    lines: usize,
    fetch_calls: usize,
    requests_count: u32,
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
    stream_receiver: flume::Receiver<(u32, StreamResult)>,
    termination_tx: flume::Sender<RunResult>,
    termination_rx: flume::Receiver<RunResult>,
    heartbeat: Arc<AtomicBool>,
    running_promises: Arc<AtomicBool>,
    rx: flume::Receiver<IsolateRequest>,
    near_heap_limit_callback_data: Option<Box<RefCell<dyn std::any::Any>>>,
}

unsafe impl Send for Isolate {}
unsafe impl Sync for Isolate {}

// NOTE
// All tx.send(...) can return an Err due to many reason, e.g the thread panicked
// or the connection closed on the other side, meaning the channel is now closed.
// That's why we use .unwrap_or(()) to silently discard any error.
impl Isolate {
    pub fn new(options: IsolateOptions, rx: flume::Receiver<IsolateRequest>) -> Self {
        // TODO use options.memory
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
        let (termination_tx, termination_rx) = flume::unbounded();

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
                handler_results: HashMap::new(),
                stream_sender,
                metadata: Rc::clone(&options.metadata),
                rejected_promises: LinkedHashMap::new(),
                lines: 0,
                fetch_calls: 0,
                requests_count: 0,
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        let mut this = Self {
            options,
            isolate: Some(isolate),
            handler: None,
            compilation_error: None,
            stream_receiver,
            termination_tx,
            termination_rx,
            heartbeat: Arc::new(AtomicBool::new(false)),
            running_promises: Arc::new(AtomicBool::new(false)),
            rx,
            near_heap_limit_callback_data: None,
        };

        let thread_safe_handle = this.isolate.as_ref().unwrap().thread_safe_handle();

        this.set_heap_limit_callback(move |current: usize| {
            if !thread_safe_handle.is_execution_terminating() {
                thread_safe_handle.terminate_execution();
            }

            // Avoid OOM killer by increasing the limit, since we kill
            // the isolate above.
            current * 2
        });

        this
    }

    fn set_heap_limit_callback<C>(&mut self, callback: C)
    where
        C: FnMut(usize) -> usize + 'static,
    {
        let callback = Box::new(RefCell::new(callback));
        let data = callback.as_ptr() as *mut std::ffi::c_void;

        self.near_heap_limit_callback_data = Some(callback);
        self.isolate
            .as_mut()
            .unwrap()
            .add_near_heap_limit_callback(heap_limit_callback::<C>, data);
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

    pub fn evaluate(&mut self) {
        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let global = {
            let state = isolate_state.borrow();
            state.global.as_ref().unwrap().0.clone()
        };

        let scope =
            &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global.clone());
        let try_catch = &mut v8::TryCatch::new(scope);

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

        let thread_safe_handle = try_catch.thread_safe_handle();
        let termination_tx = self.termination_tx.clone();
        let duration = self.options.timeout;
        let heartbeat = Arc::clone(&self.heartbeat);

        std::thread::spawn(move || loop {
            std::thread::sleep(duration);

            if !heartbeat.load(Ordering::SeqCst) {
                termination_tx.send(RunResult::Timeout).unwrap_or(());

                if !thread_safe_handle.is_execution_terminating() {
                    thread_safe_handle.terminate_execution();
                }

                break;
            } else {
                heartbeat.store(false, Ordering::SeqCst);
            }
        });

        match v8::script_compiler::compile_module(try_catch, source) {
            Some(module) => {
                if module
                    .instantiate_module(try_catch, resolve_module_callback)
                    .is_none()
                {
                    self.compilation_error = Some(handle_error(try_catch, lines).as_error());
                    return;
                }

                if module.evaluate(try_catch).is_none() {
                    self.compilation_error = Some(handle_error(try_catch, lines).as_error());
                    return;
                }

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
            None => {
                self.compilation_error = Some(handle_error(try_catch, lines).as_error());
            }
        };
    }

    fn poll_new_requests(&mut self) {
        if let Ok(IsolateRequest { request, sender }) = self.rx.try_recv() {
            let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
            let (global, requests_count) = {
                let mut isolate_state = isolate_state.borrow_mut();
                let global = isolate_state.global.as_ref().unwrap().0.clone();

                isolate_state.requests_count += 1;

                (global, isolate_state.requests_count)
            };
            let scope =
                &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global.clone());
            let try_catch = &mut v8::TryCatch::new(scope);

            let handler = self.handler.as_ref().unwrap();
            let handler = handler.open(try_catch);

            let global = global.open(try_catch);
            let global = global.global(try_catch);

            let request = request.into_v8(try_catch);
            let id = v8::Integer::new(try_catch, requests_count as i32);

            match handler.call(try_catch, global.into(), &[id.into(), request.into()]) {
                Some(response) => {
                    let promise = v8::Local::<v8::Promise>::try_from(response)
                        .expect("Handler did not return a promise");
                    let promise = v8::Global::new(try_catch, promise);

                    isolate_state.borrow_mut().handler_results.insert(
                        requests_count,
                        HandlerResult {
                            promise,
                            sender,
                            stream_response_sent: RefCell::new(false),
                            stream_status: RefCell::new(StreamStatus::None),
                            context: RequestContext::default(),
                        },
                    );
                }
                None => {
                    let run_result = match try_catch.is_execution_terminating() {
                        true => RunResult::MemoryLimit,
                        false => handle_error(try_catch, 0),
                    };

                    self.termination_tx.send(run_result).unwrap_or(());
                }
            };
        }
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

                while let Poll::Ready(Some(BindingResult { id, result })) =
                    isolate_state.promises.poll_next_unpin(cx)
                {
                    if let Some(promise) = isolate_state.js_promises.remove(&id) {
                        promises.as_mut().unwrap().push((result, promise));
                    }
                }

                self.running_promises.store(false, Ordering::SeqCst);
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

    fn poll_stream(&mut self, state: &RefMut<IsolateState>) {
        while let Ok(stream_result) = self.stream_receiver.try_recv() {
            let (id, stream_result) = stream_result;

            if let Some(handler_result) = state.handler_results.get(&id) {
                let mut stream_status = handler_result.stream_status.borrow_mut();

                // Set that we are streaming if it's the first time
                // we receive a stream event
                if let StreamStatus::None = *stream_status {
                    *stream_status = StreamStatus::HasStream;
                }

                if let StreamResult::Done = stream_result {
                    *stream_status = StreamStatus::Done;
                }

                handler_result
                    .sender
                    .send(RunResult::Stream(stream_result))
                    .unwrap_or(());
            }
        }
    }

    fn poll_event_loop(&mut self, cx: &mut Context) -> Poll<()> {
        if let Some(compilation_error) = &self.compilation_error {
            if let Ok(isolate_request) = self.rx.try_recv() {
                let run_result = match self.termination_rx.try_recv() {
                    Ok(run_result) => run_result,
                    Err(_) => RunResult::Error(compilation_error.to_string()),
                };

                isolate_request.sender.send(run_result).unwrap_or(());
            }

            return Poll::Pending;
        }

        self.heartbeat.store(true, Ordering::SeqCst);

        self.poll_new_requests();
        self.poll_v8();
        self.resolve_promises(cx);

        let isolate_state = Isolate::state(self.isolate.as_ref().unwrap());
        let mut state = isolate_state.borrow_mut();

        self.poll_stream(&state);

        if let Ok(run_result) = self.termination_rx.try_recv() {
            for handler_result in state.handler_results.values() {
                handler_result.sender.send(run_result.clone()).unwrap_or(());
            }

            return Poll::Ready(());
        }

        if !state.rejected_promises.is_empty() {
            let key = state.rejected_promises.keys().last().unwrap().clone();
            let content = state.rejected_promises.remove(&key).unwrap();

            // TODO: only send the error to the request that caused it
            for handler_result in state.handler_results.values() {
                handler_result
                    .sender
                    .send(RunResult::Error(content.clone()))
                    .unwrap_or(());
            }
        }

        let global = state.global.as_ref().unwrap().0.clone();
        let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);
        let try_catch = &mut v8::TryCatch::new(scope);
        let lines = state.lines;

        state.handler_results.retain(|_, handler_result| {
            if *handler_result.stream_response_sent.borrow() {
                if handler_result.stream_status.borrow().is_done() {
                    return false;
                }

                return true;
            }

            let promise = &handler_result.promise;
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
                            handler_result
                                .sender
                                .send(RunResult::Stream(StreamResult::Start(response.clone())))
                                .unwrap_or(());

                            *handler_result.stream_response_sent.borrow_mut() = true;

                            return true;
                        }
                    }

                    handler_result.sender.send(run_result).unwrap_or(());

                    false
                }
                v8::PromiseState::Rejected => {
                    let exception = promise.result(try_catch);

                    handler_result
                        .sender
                        .send(RunResult::Error(get_exception_message(
                            try_catch, exception, lines,
                        )))
                        .unwrap_or(());

                    false
                }
                v8::PromiseState::Pending => true,
            }
        });

        cx.waker().wake_by_ref();
        Poll::Pending
    }

    pub async fn run_event_loop(&mut self) {
        poll_fn(|cx| self.poll_event_loop(cx)).await;
    }

    pub fn snapshot(&mut self) -> v8::StartupData {
        self.evaluate();

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
