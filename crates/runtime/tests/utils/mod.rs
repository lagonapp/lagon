use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::RunResult;
use lagon_runtime_isolate::{options::IsolateOptions, Isolate, IsolateRequest};
use std::sync::Once;

#[allow(dead_code)]
pub fn setup() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default());
    });
}

#[allow(dead_code)]
pub fn setup_allow_codegen() {
    static START: Once = Once::new();

    START.call_once(|| {
        Runtime::new(RuntimeOptions::default().allow_code_generation(true));
    });
}

#[allow(dead_code)]
static mut RX: Option<flume::Receiver<String>> = None;

#[allow(dead_code)]
pub fn setup_logger() -> flume::Receiver<String> {
    static START: Once = Once::new();

    START.call_once(|| {
        let (tx, rx) = flume::unbounded();

        struct Logger {
            tx: flume::Sender<String>,
        }

        impl log::Log for Logger {
            fn enabled(&self, _metadata: &log::Metadata) -> bool {
                true
            }
            fn log(&self, record: &log::Record) {
                self.tx.send(record.args().to_string()).unwrap();
            }
            fn flush(&self) {}
        }

        log::set_boxed_logger(Box::new(Logger { tx })).unwrap();
        log::set_max_level(log::LevelFilter::Info);

        unsafe { RX = Some(rx) };
    });

    unsafe { RX.clone() }.unwrap()
}

#[allow(dead_code)]
pub fn create_isolate(
    options: IsolateOptions,
) -> (
    Isolate,
    flume::Sender<IsolateRequest>,
    flume::Sender<RunResult>,
    flume::Receiver<RunResult>,
) {
    let (request_tx, request_rx) = flume::unbounded();
    let (sender, receiver) = flume::unbounded();
    let mut isolate = Isolate::new(options, request_rx);
    isolate.evaluate();

    (isolate, request_tx, sender, receiver)
}
