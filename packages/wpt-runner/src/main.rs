use colored::*;
use lazy_static::lazy_static;
use log::{
    set_boxed_logger, set_max_level, Level, LevelFilter, Log, Metadata, Record, SetLoggerError,
};
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::exit,
    sync::Mutex,
};

use lagon_runtime::{
    http::{Request, RunResult},
    isolate::{Isolate, IsolateOptions},
    runtime::{Runtime, RuntimeOptions},
};

// From tools/wpt/encoding/resources/encodings.js, we only support utf-8
const ENCODING_TABLE: &str = r#"const encodings_table =
[
  {
    "encodings": [
      {
        "labels": [
          "unicode-1-1-utf-8",
          "unicode11utf8",
          "unicode20utf8",
          "utf-8",
          "utf8",
          "x-unicode20utf8"
        ],
        "name": "UTF-8"
      }
    ],
    "heading": "The Encoding"
  }
]"#;
const REQUEST_CACHE: &str = include_str!("../../../tools/wpt/fetch/api/request/request-cache.js");
const SUBSET_TESTS: &str = include_str!("../../../tools/wpt/common/subset-tests.js");
const DECODING_HELPERS: &str =
    include_str!("../../../tools/wpt/encoding/resources/decoding-helpers.js");
const SUPPORT_BLOB: &str = include_str!("../../../tools/wpt/FileAPI/support/Blob.js");

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

const SKIP_TESTS: [&str; 14] = [
    // request
    "request-error.any.js",         // "badRequestArgTests is not defined"
    "request-init-stream.any.js",   // "request.body.getReader is not a function"
    "request-consume-empty.any.js", // "Unexpected end of JSON input"
    "request-consume.any.js",       // "Unexpected end of JSON input"
    // response
    "response-cancel-stream.any.js",           // "undefined"
    "response-error-from-stream.any.js",       // "Start error"
    "response-stream-with-broken-then.any.js", // "Cannot destructure property 'done' of 'undefined' as it is undefine"
    // url
    "idlharness.any.js",  // load webidl stuff, not supported
    "url-setters.any.js", // fetch an json file, find a way to run it
    // encoding
    "textdecoder-utf16-surrogates.any.js", // we only support utf-8
    "textencoder-utf16-surrogates.any.js", // we only support utf-8
    "iso-2022-jp-decoder.any.js",          // we only support utf-8
    "encodeInto.any.js",                   // TextEncoder#encodeInto isn't implemented yet
    "textdecoder-fatal-single-byte.any.js", // have a random number of tests?
];

async fn run_test(path: &Path) {
    let display = path.display().to_string();

    if !display.ends_with(".any.js") {
        return;
    }

    if SKIP_TESTS.iter().any(|&s| display.ends_with(s)) {
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
globalThis.location = {{}}

export function handler() {{
    {}
    {ENCODING_TABLE}
    {REQUEST_CACHE}
    {SUBSET_TESTS}
    {DECODING_HELPERS}
    {SUPPORT_BLOB}
    {code}
    return new Response()
}}",
        TEST_HARNESS.as_str(),
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
    let mut paths = fs::read_dir(path)
        .expect("Failed to read dir")
        .map(|r| r.unwrap().path())
        .collect::<Vec<PathBuf>>();

    paths.sort();

    for path in paths {
        run_test(&path).await;
    }
}

#[tokio::main]
async fn main() {
    let runtime = Runtime::new(RuntimeOptions::default().with_expose_gc(true));
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

    if result.2 == 0 {
        println!(" -> 100% conformance");
    } else {
        println!(" -> {}% conformance", (result.1 * 100) / result.0);
    }

    runtime.dispose();
}
