use lagon_runtime::{options::RuntimeOptions, Runtime};
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
