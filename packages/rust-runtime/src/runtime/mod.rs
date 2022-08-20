use futures::task::noop_waker;
use lazy_static::lazy_static;
use std::{
    borrow::Borrow,
    collections::HashMap,
    ops::Deref,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    task::{Context, Poll},
    time::Instant,
};
use tokio::{
    sync::{mpsc, Mutex},
    task::spawn_blocking,
    time::{timeout, Duration},
};
use v8::{script_compiler, CreateParams, ScriptOrigin, V8};

mod allocator;
use allocator::create_allocator;
// mod isolate;
// use isolate::Isolate;
mod isolate;
pub use isolate::Isolate;

use crate::extract::extract_v8_string;
use crate::result::RunResult;

pub trait Allocated<T: ?Sized>: Deref<Target = T> + Borrow<T> + 'static {}

pub struct RuntimeOptions {
    pub timeout: u64,
    pub memory_limit: usize,
    pub allow_eval: bool,
    // pub snapshot_blob: Option<Box<dyn Allocated<[u8]>>>,
}

impl RuntimeOptions {
    pub fn new() -> RuntimeOptions {
        RuntimeOptions {
            timeout: 50,
            memory_limit: 128, // TODO
            allow_eval: false,
            // snapshot_blob: None,
        }
    }

    pub fn with_timeout(mut self, timeout: u64) -> RuntimeOptions {
        self.timeout = timeout;
        self
    }

    pub fn with_memory_limit(mut self, memory_limit: usize) -> RuntimeOptions {
        self.memory_limit = memory_limit;
        self
    }

    // pub fn with_snapshot_blob(mut self, snapshot_blob: impl Allocated<[u8]>) -> RuntimeOptions {
    //     self.snapshot_blob = Some(Box::new(snapshot_blob));
    //     self
    // }
}

// lazy_static! {
//     static ref ISOLATES: Mutex<HashMap<String, Isolate>> = Mutex::new(HashMap::new());
// }

pub struct Runtime {
    options: RuntimeOptions,
    // isolates: HashMap<String, v8::OwnedIsolate>
    // isolates: HashMap<String, Isolate<'static>>
    isolates: HashMap<String, Isolate>,
}

unsafe impl Send for Runtime {}
unsafe impl Sync for Runtime {}

impl Runtime {
    pub fn new(options: Option<RuntimeOptions>) -> Self {
        let platform = v8::new_default_platform(0, false).make_shared();
        V8::initialize_platform(platform);
        V8::initialize();

        let options = options.unwrap_or(RuntimeOptions::new());

        // Disable code generation from `eval(...)` / `new Function(...)`
        if !options.allow_eval {
            V8::set_flags_from_string("--disallow-code-generation-from-strings");
        }

        Runtime {
            options,
            isolates: HashMap::new(),
        }
    }

    pub async fn get_isolate(&mut self, hostname: String) -> RunResult {
        let memory_limit = self.options.memory_limit;

        let lock = Instant::now();

        // let mut isolates = ISOLATES.lock().await;
        let isolate = self
            .isolates
            .entry(hostname)
            .or_insert_with(|| Isolate::new());

        let result = isolate.run();

        println!("locked {:?}", lock.elapsed());

        result
    }

    // pub async fn run(&self, code: &'static str, filename: Option<&'static str>) -> RunResult {
    //     let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);
    //     let memory_limit = self.options.memory_limit;

    //     let run_isolate = spawn_blocking(move || {
    //         let memory_mb = memory_limit * 1024 * 1024;
    //         let count = Arc::new(AtomicUsize::new(memory_limit));
    //         let array_buffer_allocator = create_allocator(count.clone());

    //         let params = CreateParams::default()
    //             .heap_limits(0, memory_mb)
    //             .array_buffer_allocator(array_buffer_allocator);

    //         // if let Some(snapshot_blob) = self.options.snapshot_blob {
    //         //     params = params.snapshot_blob(snapshot_blob.as_mut());
    //         // }

    //         let mut isolate = v8::Isolate::new(params);
    //         let isolate_handle = isolate.thread_safe_handle();
    //         let mut handle_scope = v8::HandleScope::new(&mut isolate);

    //         fn log_callback(
    //             scope: &mut v8::HandleScope,
    //             args: v8::FunctionCallbackArguments,
    //             mut _retval: v8::ReturnValue,
    //         ) {
    //             let message = args
    //                 .get(0)
    //                 .to_string(scope)
    //                 .unwrap()
    //                 .to_rust_string_lossy(scope);

    //             println!("Logged: {}", message);
    //         }

    //         let global = v8::ObjectTemplate::new(&mut handle_scope);
    //         let function_name = v8::String::new(&mut handle_scope, "log").unwrap();
    //         let function_callback = v8::FunctionTemplate::new(&mut handle_scope, log_callback);
    //         global.set(function_name.into(), function_callback.into());

    //         let context = v8::Context::new_from_template(&mut handle_scope, global);
    //         let scope = &mut v8::ContextScope::new(&mut handle_scope, context);

    //         let code = v8::String::new(scope, code).unwrap();

    //         let resource_name = v8::String::new(scope, filename.unwrap_or("isolate.js")).unwrap();
    //         let source_map_url = v8::String::new(scope, "").unwrap();

    //         let source = script_compiler::Source::new(
    //             code,
    //             Some(&ScriptOrigin::new(
    //                 scope,
    //                 resource_name.into(),
    //                 0,
    //                 0,
    //                 false,
    //                 0,
    //                 source_map_url.into(),
    //                 false,
    //                 false,
    //                 true,
    //             )),
    //         );

    //         let module = script_compiler::compile_module(scope, source).unwrap();

    //         // TODO: disable imports
    //         module.instantiate_module(scope, |a, b, c, d| None).unwrap();
    //         module.evaluate(scope).unwrap();

    //         let namespace = module.get_module_namespace();
    //         let namespace = v8::Local::<v8::Object>::try_from(namespace).unwrap();

    //         let handler = v8::String::new(scope, "handler").unwrap();
    //         let handler = namespace.get(scope, handler.into()).unwrap();
    //         let handler = v8::Local::<v8::Function>::try_from(handler).unwrap();

    //         let try_catch = &mut v8::TryCatch::new(scope);
    //         let global: v8::Local<v8::Value> = context.global(try_catch).into();

    //         let loop_count = count.clone();

    //         spawn_blocking(move || {
    //             let waker = noop_waker();
    //             let mut cx = Context::from_waker(&waker);

    //             loop {
    //                 match shutdown_rx.poll_recv(&mut cx) {
    //                     Poll::Ready(result) => {
    //                         // Only destory the isolate if we're explicitly shutting down.
    //                         if result.is_some() {
    //                             isolate_handle.terminate_execution();
    //                         }

    //                         break;
    //                     }
    //                     _ => {
    //                         if loop_count.load(Ordering::SeqCst) >= memory_mb {
    //                             isolate_handle.terminate_execution();
    //                             break;
    //                         }
    //                     }
    //                 };
    //             }
    //         });

    //         let now = Instant::now();

    //         match handler.call(try_catch, global, &[]) {
    //             Some(result) => {
    //                 let response = extract_v8_string(result, try_catch).unwrap();

    //                 RunResult::Response(response, now.elapsed())
    //             }
    //             None => {
    //                 let exception = try_catch.exception().unwrap();

    //                 match extract_v8_string(exception, try_catch) {
    //                     Some(error) => RunResult::Error(error),
    //                     // Can be caused by memory limit being reached, or maybe by something else?
    //                     None => {
    //                         if count.load(Ordering::SeqCst) >= memory_mb {
    //                             RunResult::MemoryLimit()
    //                         } else {
    //                             RunResult::Error("Unknown error".to_string())
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     });

    //     // Run the isolate with the given timeout.
    //     match timeout(Duration::from_millis(self.options.timeout), run_isolate).await {
    //         Ok(result) => result.unwrap(),
    //         Err(_) => {
    //             shutdown_tx.send(()).await.expect("Failed to send");
    //             RunResult::Timeout()
    //         }
    //     }
    // }

    pub fn dispose(&self) {
        unsafe {
            V8::dispose();
        }

        V8::dispose_platform();
    }
}

impl Drop for Runtime {
    fn drop(&mut self) {
        self.dispose();
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use lazy_static::lazy_static;

//     lazy_static! {
//         static ref RUNTIME: Runtime = Runtime::new(None);
//     }

//     #[tokio::test]
//     async fn disable_code_generation_from_strings_with_eval() {
//         let result = RUNTIME
//             .run(
//                 "export function handler() {
//                 eval('test');
//             }",
//                 None,
//             )
//             .await;
//         assert_eq!(
//             result,
//             RunResult::Error(
//                 "EvalError: Code generation from strings disallowed for this context".to_string()
//             )
//         );
//     }

//     #[tokio::test]
//     async fn disable_code_generation_from_strings_with_new_function() {
//         let result = RUNTIME
//             .run(
//                 "export function handler() {
//                 new Function('test')
//             }",
//                 None,
//             )
//             .await;
//         assert_eq!(
//             result,
//             RunResult::Error(
//                 "EvalError: Code generation from strings disallowed for this context".to_string()
//             )
//         );
//     }

//     #[tokio::test]
//     async fn cpu_timeout() {
//         let result = RUNTIME
//             .run(
//                 "export function handler() {
//                 while (true) {}
//             }",
//                 None,
//             )
//             .await;
//         assert_eq!(result, RunResult::Timeout());
//     }

//     #[tokio::test]
//     async fn memory_limit() {
//         let result = RUNTIME.run(
//             "export function handler() {
//                 const storage = [];
//                 const twoMegabytes = 1024 * 1024 * 2;
//                 while (true) {
//                     const array = new Uint8Array(twoMegabytes);
//                     for (let ii = 0; ii < twoMegabytes; ii += 4096) {
//                         array[ii] = 1; // we have to put something in the array to flush to real memory
//                     }
//                     storage.push(array);
//                 }
//             }",
//             None,
//         ).await;
//         assert_eq!(result, RunResult::MemoryLimit());
//     }
// }
