use colored::*;
use lazy_static::lazy_static;
use log::{
    set_boxed_logger, set_max_level, Level, LevelFilter, Log, Metadata, Record, SetLoggerError,
};
use std::{env, fs, path::Path, process::exit, sync::Mutex};

use lagon_runtime::{
    http::{Request, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

const ENCODING_TABLE: &str = include_str!("../../../tools/wpt/encoding/resources/encodings.js");

lazy_static! {
    static ref RESULT: Mutex<(usize, usize, usize)> = Mutex::new((0, 0, 0));
    static ref TEST_HARNESS: String = include_str!("../../../tools/wpt/resources/testharness.js")
        .to_owned()
        .replace("})(self);", "})(globalThis);")
        .replace("debug: false", "debug: true");
}

struct SimpleLogger;

impl Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let content = record.args().to_string();

            if content.starts_with("TEST DONE 0") {
                RESULT.lock().unwrap().1 += 1;
                println!("{}", content.green());
            } else if content.starts_with("TEST DONE 1") {
                RESULT.lock().unwrap().2 += 1;
                println!("{}", content.red());
            } else if content.starts_with("TEST START") {
                RESULT.lock().unwrap().0 += 1;
            } else {
                println!("{}", content.black());
            }
        }
    }

    fn flush(&self) {}
}

fn init_logger() -> Result<(), SetLoggerError> {
    set_boxed_logger(Box::new(SimpleLogger)).map(|()| set_max_level(LevelFilter::Info))?;
    Ok(())
}

const SKIP_TESTS: [&str; 17] = [
    // request
    "request-cache-default-conditional.any.js",
    "request-cache-no-cache.any.js",
    "request-cache-no-store.any.js",
    "request-cache-force-cache.any.js",
    "request-cache-default.any.js",
    "request-cache-only-if-cached.any.js",
    "request-cache-reload.any.js",
    "request-bad-port.any.js",
    "request/request-error.any.js",
    // url
    "idlharness.any.js",
    "url-setters.any.js",
    // encoding
    "textdecoder-fatal-single-byte.any.js",
    "unsupported-encodings.any.js",
    "api-invalid-label.any.js",
    "replacement-encodings.any.js",
    // blob
    "Blob-slice.any.js",
    "Blob-constructor.any.js",
];

async fn run_test(path: &Path) {
    let display = path.display().to_string();

    if !display.ends_with(".any.js") {
        return;
    }

    if SKIP_TESTS.iter().any(|&s| display.contains(s)) {
        println!("{} {}", "Skipping".yellow(), display);
        return;
    }

    println!("{} {}", "Running".blue(), display);

    let code = fs::read_to_string(path).expect("Failed to read file");

    let code = format!(
        "globalThis.GLOBAL = {{
    isWorker: () => false,
    isShadowRealm: () => false,
    isWindow: () => false,
}}

export function handler() {{
    {}
    {ENCODING_TABLE}
    {code}
    return new Response()
}}",
        TEST_HARNESS.as_str()
    )
    .replace("self.", "globalThis.");

    let mut isolate = Isolate::new(
        IsolateOptions::new(code).with_metadata(Some((String::from(""), String::from("")))),
    );

    let (tx, rx) = flume::unbounded();
    isolate.run(Request::default(), tx).await;

    if let RunResult::Error(error) = rx.recv().expect("Failed to receive response") {
        println!("{}", error);
        exit(1);
    }
}

async fn test_directory(path: &Path) {
    for path in fs::read_dir(path).expect("Failed to read dir") {
        let path = path.unwrap().path();

        run_test(&path).await;
    }
}

#[tokio::main]
async fn main() {
    let runtime = Runtime::new(RuntimeOptions::default());
    init_logger().expect("Failed to initialize logger");

    if let Some(path) = env::args().nth(1) {
        let path = Path::new(&path);

        if path.is_dir() {
            test_directory(path).await;
        } else {
            run_test(path).await;
        }
    } else {
        test_directory(Path::new("../../tools/wpt/fetch/api/headers")).await;
        test_directory(Path::new("../../tools/wpt/fetch/api/body")).await;
        test_directory(Path::new("../../tools/wpt/fetch/api/request")).await;
        test_directory(Path::new("../../tools/wpt/fetch/api/response")).await;
        test_directory(Path::new("../../tools/wpt/url")).await;
        // TODO
        // Enable when CompressionStream/DecompressionStream are implemented
        // test_directory(Path::new("../../tools/wpt/compression")).await;
        test_directory(Path::new("../../tools/wpt/encoding")).await;
        test_directory(Path::new("../../tools/wpt/FileAPI/blob")).await;
    }

    let result = RESULT.lock().unwrap();
    println!();
    println!(
        "{} tests, {} passed, {} failed",
        result.0,
        result.1.to_string().green(),
        result.2.to_string().red()
    );

    runtime.dispose();
}
