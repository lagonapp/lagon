use bindings::websocket::WSResourceTable;
use futures::{future::poll_fn, stream::FuturesUnordered, Future, StreamExt};
use hyper::{
    body::Bytes,
    http::{request::Parts, response::Builder},
};
use lagon_runtime_http::{request_to_v8, response_from_v8, RunResult, StreamResult};
use lagon_runtime_v8_utils::v8_string;
use lagon_runtime_websocket::{Ws, WsId};
use linked_hash_map::LinkedHashMap;
use std::{
    cell::{RefCell, RefMut},
    collections::{BTreeMap, HashMap},
    pin::Pin,
    rc::Rc,
    sync::{Arc, RwLock},
    task::{Context, Poll},
    time::Instant,
};
use tokio::sync::Mutex;
use v8::MapFnTo;

use self::{
    bindings::{BindingResult, PromiseResult},
    callbacks::{heap_limit_callback, promise_reject_callback, resolve_module_callback},
    options::{IsolateOptions, Metadata},
};

mod bindings;
mod callbacks;
pub mod options;

const RUNTIME_ONLY_SCRIPT_NAME: &str = "runtime.js";
const CODE_ONLY_SCRIPT_NAME: &str = "code.js";
const ISOLATE_SCRIPT_NAME: &str = "isolate.js";

#[derive(Debug, Default)]
pub struct RequestContext {
    fetch_calls: usize,
}

pub struct IsolateRequest {
    pub request: (Parts, Bytes),
    pub sender: flume::Sender<RunResult>,
}

pub enum IsolateEvent {
    Request(IsolateRequest),
    Terminate(String),
}

#[derive(Debug)]
pub struct HandlerResult {
    promise: Option<v8::Global<v8::Promise>>,
    sender: flume::Sender<RunResult>,
    start_time: Instant,
    stream_response_sent: RefCell<bool>,
    stream_status: RefCell<StreamStatus>,
    context: RequestContext,
}

#[derive(Debug, Clone)]
struct Global(v8::Global<v8::Context>);

pub struct IsolateState {
    global: Option<Global>,
    promises: FuturesUnordered<Pin<Box<dyn Future<Output = BindingResult>>>>,
    js_promises: HashMap<usize, v8::Global<v8::PromiseResolver>>,
    handler_results: HashMap<u32, HandlerResult>,
    stream_sender: flume::Sender<(u32, StreamResult)>,
    metadata: Rc<Metadata>,
    rejected_promises: LinkedHashMap<v8::Global<v8::Promise>, String>,
    lines: usize,
    requests_count: u32,
    log_sender: Option<flume::Sender<(String, String, Metadata)>>,
    ws_resource_table: WSResourceTable,
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

#[derive(Debug)]
enum Heartbeat {
    None,
    Some,
    Waiting,
}

impl Heartbeat {
    pub fn is_waiting(&self) -> bool {
        matches!(self, Heartbeat::Waiting)
    }

    pub fn is_none(&self) -> bool {
        matches!(self, Heartbeat::None)
    }
}

pub struct Isolate {
    options: IsolateOptions,
    isolate: Option<v8::OwnedIsolate>,
    master_handler: Option<v8::Global<v8::Function>>,
    handler: Option<v8::Global<v8::Value>>,
    compilation_error: Option<String>,
    stream_receiver: flume::Receiver<(u32, StreamResult)>,
    termination_result: Arc<RwLock<Option<RunResult>>>,
    heartbeat: Arc<RwLock<Heartbeat>>,
    rx: flume::Receiver<IsolateEvent>,
    near_heap_limit_callback_data: Option<Box<RefCell<dyn std::any::Any>>>,
    last_statistic_sent: Instant,
}

unsafe impl Send for Isolate {}
unsafe impl Sync for Isolate {}

// NOTE
// All tx.send(...) can return an Err due to many reason, e.g the thread panicked
// or the connection closed on the other side, meaning the channel is now closed.
// That's why we use .unwrap_or(()) to silently discard any error.
impl Isolate {
    pub fn new(options: IsolateOptions, rx: flume::Receiver<IsolateEvent>) -> Self {
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
                handler_results: HashMap::new(),
                stream_sender,
                metadata: Rc::clone(&options.metadata),
                rejected_promises: LinkedHashMap::new(),
                lines: 0,
                requests_count: 0,
                log_sender: options.log_sender.clone(),
                ws_resource_table: WSResourceTable::new(Arc::new(Mutex::new(
                    BTreeMap::<WsId, Ws>::new(),
                ))),
            }
        };

        isolate.set_slot(Rc::new(RefCell::new(state)));

        let mut this = Self {
            options,
            isolate: Some(isolate),
            master_handler: None,
            handler: None,
            compilation_error: None,
            stream_receiver,
            termination_result: Arc::new(RwLock::new(None)),
            heartbeat: Arc::new(RwLock::new(Heartbeat::None)),
            rx,
            near_heap_limit_callback_data: None,
            last_statistic_sent: Instant::now(),
        };

        let thread_safe_handle = this.isolate.as_ref().unwrap().thread_safe_handle();
        let termination_result_handle = Arc::clone(&this.termination_result);

        this.set_heap_limit_callback(move |current: usize| {
            termination_result_handle
                .write()
                .unwrap()
                .replace(RunResult::MemoryLimit);

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

    fn terminate(&mut self, run_result: RunResult) {
        self.termination_result.write().unwrap().replace(run_result);

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
        let termination_result = Arc::clone(&self.termination_result);
        let tick_timeout = self.options.tick_timeout;
        let heartbeat = Arc::clone(&self.heartbeat);

        std::thread::spawn(move || {
            // Isolates are terminated when they miss at least two heartbeats. The heartbeat
            // missed count isn't reset to zero when a heartbeat has been successfully received:
            // instead, the heartbeat missed count is decremented by one, allowing to safely
            // terminate faulty isolates that are stuck in an infinite loop, and not randomly
            // terminate isolates that just happen to be "slow"
            let mut missed_heartbeat = 0;

            loop {
                std::thread::sleep(tick_timeout);

                let heartbeat_value = heartbeat.read().unwrap();

                if heartbeat_value.is_waiting() {
                    continue;
                }

                if heartbeat_value.is_none() {
                    missed_heartbeat += 1;
                } else if missed_heartbeat > 0 {
                    missed_heartbeat -= 1;
                }

                if missed_heartbeat >= 2 {
                    termination_result
                        .write()
                        .unwrap()
                        .replace(RunResult::Timeout);

                    if !thread_safe_handle.is_execution_terminating() {
                        thread_safe_handle.terminate_execution();
                    }

                    break;
                } else {
                    drop(heartbeat_value);
                    *heartbeat.write().unwrap() = Heartbeat::None;
                }
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
                    let namespace = module.get_module_namespace().to_object(try_catch).unwrap();
                    let handler_key = v8_string(try_catch, "handler");
                    let handler = namespace.get(try_catch, handler_key.into()).unwrap();
                    let handler = v8::Global::new(try_catch, handler);

                    self.handler = Some(handler);

                    let global = global.open(try_catch);
                    let global = global.global(try_catch);
                    let handler_key = v8_string(try_catch, "masterHandler");
                    let handler = global.get(try_catch, handler_key.into()).unwrap();
                    let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();
                    let handler = v8::Global::new(try_catch, handler);

                    self.master_handler = Some(handler);
                }
            }
            None => {
                self.compilation_error = Some(handle_error(try_catch, lines).as_error());
            }
        };
    }

    pub fn handle_event(&mut self, event: IsolateEvent, state: &Rc<RefCell<IsolateState>>) {
        match event {
            IsolateEvent::Request(IsolateRequest { request, sender }) => {
                let (global, requests_count) = {
                    let mut isolate_state = state.borrow_mut();
                    let global = isolate_state.global.as_ref().unwrap().0.clone();

                    isolate_state.requests_count += 1;

                    (global, isolate_state.requests_count)
                };
                let scope = &mut v8::HandleScope::with_context(
                    self.isolate.as_mut().unwrap(),
                    global.clone(),
                );
                let try_catch = &mut v8::TryCatch::new(scope);

                let master_handler = self.master_handler.as_ref().unwrap();
                let master_handler = master_handler.open(try_catch);

                let handler = self.handler.as_ref().unwrap();
                let handler = v8::Local::new(try_catch, handler);

                let global = global.open(try_catch);
                let global = global.global(try_catch);

                let request = request_to_v8(request, try_catch);
                let id = v8::Integer::new(try_catch, requests_count as i32);
                try_catch.set_continuation_preserved_embedder_data(id.into());

                state.borrow_mut().handler_results.insert(
                    requests_count,
                    HandlerResult {
                        promise: None,
                        sender,
                        start_time: Instant::now(),
                        stream_response_sent: RefCell::new(false),
                        stream_status: RefCell::new(StreamStatus::None),
                        context: RequestContext::default(),
                    },
                );

                match master_handler.call(
                    try_catch,
                    global.into(),
                    &[id.into(), handler, request.into()],
                ) {
                    Some(response) => {
                        let promise = v8::Local::<v8::Promise>::try_from(response)
                            .expect("Handler did not return a promise");
                        let promise = v8::Global::new(try_catch, promise);

                        if let Some(handler_result) =
                            state.borrow_mut().handler_results.get_mut(&requests_count)
                        {
                            handler_result.promise = Some(promise);
                        }
                    }
                    None => {
                        // Use the current termination result (e.g timeout or memory),
                        // or try to handle an error
                        self.termination_result
                            .write()
                            .unwrap()
                            .get_or_insert_with(|| handle_error(try_catch, 0));
                    }
                };
            }
            IsolateEvent::Terminate(reason) => {
                self.terminate(RunResult::Error(reason));
            }
        }
    }

    fn poll_v8(&mut self, global: &v8::Global<v8::Context>) {
        let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);

        while v8::Platform::pump_message_loop(&v8::V8::get_current_platform(), scope, false) {}
        scope.perform_microtask_checkpoint();
    }

    fn resolve_promises(
        &mut self,
        cx: &mut Context,
        global: &v8::Global<v8::Context>,
        state: &Rc<RefCell<IsolateState>>,
    ) {
        let mut promises = None;

        {
            let mut state = state.borrow_mut();

            if !state.promises.is_empty() {
                promises = Some(Vec::new());

                while let Poll::Ready(Some(BindingResult { id, result })) =
                    state.promises.poll_next_unpin(cx)
                {
                    if let Some(promise) = state.js_promises.remove(&id) {
                        promises.as_mut().unwrap().push((result, promise));
                    }
                }
            }
        }

        if let Some(promises) = promises {
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

    fn poll_stream(&self, state: &RefMut<IsolateState>) {
        while let Ok(stream_result) = self.stream_receiver.try_recv() {
            let (id, stream_result) = stream_result;

            if let Some(handler_result) = state.handler_results.get(&id) {
                let mut stream_status = handler_result.stream_status.borrow_mut();

                // Set that we are streaming if it's the first time
                // we receive a stream event
                if let StreamStatus::None = *stream_status {
                    *stream_status = StreamStatus::HasStream;
                }

                if let StreamResult::Done(_) = stream_result {
                    *stream_status = StreamStatus::Done;

                    handler_result
                        .sender
                        .send(RunResult::Stream(StreamResult::Done(
                            handler_result.start_time.elapsed(),
                        )))
                        .unwrap_or(());
                } else {
                    handler_result
                        .sender
                        .send(RunResult::Stream(stream_result))
                        .unwrap_or(());
                }
            }
        }
    }

    fn poll_event_loop(&mut self, cx: &mut Context) -> Poll<()> {
        if let Some(compilation_error) = &self.compilation_error {
            if let Ok(IsolateEvent::Request(IsolateRequest { sender, .. })) = self.rx.try_recv() {
                let termination_result = match self.termination_result.write().unwrap().take() {
                    Some(termination_result) => termination_result,
                    None => RunResult::Error(compilation_error.to_string()),
                };

                sender.send(termination_result).unwrap_or(());
            }

            return Poll::Ready(());
        }

        let state = Isolate::state(self.isolate.as_ref().unwrap());

        // If no requests are being processed, we can block this thread (`rx.recv`)
        // while we wait for a new request. The heartbeat status is set to Waiting
        // to avoid the isolate being terminated. If we are already processing requests,
        // try to receive any other request
        if state.borrow().handler_results.is_empty() {
            *self.heartbeat.write().unwrap() = Heartbeat::Waiting;

            if let Ok(event) = self.rx.recv() {
                *self.heartbeat.write().unwrap() = Heartbeat::Some;
                self.handle_event(event, &state);
            }
        } else {
            *self.heartbeat.write().unwrap() = Heartbeat::Some;

            while let Ok(event) = self.rx.try_recv() {
                self.handle_event(event, &state);
            }
        }

        let global = {
            let state = state.borrow();
            state.global.as_ref().unwrap().0.clone()
        };

        self.poll_v8(&global);
        self.resolve_promises(cx, &global, &state);

        let mut state = state.borrow_mut();
        self.poll_stream(&state);

        if let Some(termination_result) = self.termination_result.write().unwrap().take() {
            if let Some(handler_result) = state.handler_results.values().next() {
                handler_result.sender.send(termination_result).unwrap_or(());
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

        let scope = &mut v8::HandleScope::with_context(self.isolate.as_mut().unwrap(), global);
        let try_catch = &mut v8::TryCatch::new(scope);
        let lines = state.lines;
        let options = &self.options;

        let should_send_statistics =
            match self.last_statistic_sent.elapsed() >= options.statistics_interval {
                true => {
                    self.last_statistic_sent = Instant::now();
                    true
                }
                false => false,
            };

        state.handler_results.retain(|_, handler_result| {
            if *handler_result.stream_response_sent.borrow() {
                if handler_result.stream_status.borrow().is_done() {
                    if should_send_statistics {
                        send_statistics(options, try_catch);
                    }

                    return false;
                }

                if handler_result.start_time.elapsed() >= options.total_timeout {
                    handler_result.sender.send(RunResult::Timeout).unwrap_or(());
                    return false;
                }

                return true;
            }

            let promise = &handler_result.promise;
            let promise = promise.as_ref().unwrap().open(try_catch);

            match promise.state() {
                v8::PromiseState::Fulfilled => {
                    let response = promise.result(try_catch);
                    let (run_result, is_streaming) = match response_from_v8(try_catch, response) {
                        Ok((response, is_streaming)) => (
                            RunResult::Response(
                                response,
                                Some(handler_result.start_time.elapsed()),
                            ),
                            is_streaming,
                        ),
                        Err(error) => (RunResult::Error(error.to_string()), false),
                    };

                    if is_streaming {
                        let response = run_result.as_response();
                        let mut response_builder = Builder::new().status(response.status());
                        let headers = response_builder.headers_mut().unwrap();

                        for (key, value) in response.headers().iter() {
                            headers.append(key, value.into());
                        }

                        handler_result
                            .sender
                            .send(RunResult::Stream(StreamResult::Start(response_builder)))
                            .unwrap_or(());

                        *handler_result.stream_response_sent.borrow_mut() = true;

                        return true;
                    }

                    handler_result.sender.send(run_result).unwrap_or(());

                    if should_send_statistics {
                        send_statistics(options, try_catch);
                    }

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

                    if should_send_statistics {
                        send_statistics(options, try_catch);
                    }

                    false
                }
                v8::PromiseState::Pending => {
                    if handler_result.start_time.elapsed() >= options.total_timeout {
                        handler_result.sender.send(RunResult::Timeout).unwrap_or(());
                        return false;
                    }

                    true
                }
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
        self.terminate(RunResult::Error(String::from("Dropped")));

        if let Some(on_drop) = &self.options.on_drop {
            on_drop(Rc::clone(&self.options.metadata));
        }
    }
}

pub fn send_statistics(options: &IsolateOptions, isolate: &mut v8::Isolate) {
    if let Some(on_statistics) = &options.on_statistics {
        let mut statistics = v8::HeapStatistics::default();
        isolate.get_heap_statistics(&mut statistics);

        on_statistics(Rc::clone(&options.metadata), statistics.used_heap_size())
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
