use colored::*;
use log::{
    set_boxed_logger, set_max_level, Level, LevelFilter, Log, Metadata, Record, SetLoggerError,
};
use std::{fs, path::Path, process::exit};

use lagon_runtime::{
    http::{Request, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

const TESTHARNESS: &str = include_str!("../../../tools/wpt/resources/testharness.js");

struct SimpleLogger;

impl Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let content = record.args().to_string();

            if content.starts_with("TEST DONE 0") {
                println!("{}", content.green());
            } else if content.starts_with("TEST DONE 1") {
                println!("{}", content.red());
            } else if !content.starts_with("TEST START") {
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

const SKIP_TESTS: [&str; 8] = [
    // headers
    "headers-no-cors.any.js",
    "header-values.any.js",
    "header-values-normalize.any.js",
    // url
    "historical.any.js",
    "idlharness.any.js",
    "url-setters.any.js",
    "url-constructor.any.js",
    "url-origin.any.js",
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
    let testharness = TESTHARNESS
        .replace("})(self);", "})(globalThis);")
        .replace("debug: false", "debug: true");

    let code = format!(
        "export function handler() {{
    {testharness}
    {code}
    return new Response()
}}"
    );

    let mut isolate = Isolate::<(String, String)>::new(
        IsolateOptions::new(code).with_metadata((String::from(""), String::from(""))),
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

    test_directory(Path::new("../../tools/wpt/fetch/api/headers")).await;
    test_directory(Path::new("../../tools/wpt/fetch/api/body")).await;
    test_directory(Path::new("../../tools/wpt/url")).await;

    runtime.dispose();
}
