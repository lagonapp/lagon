use colored::*;
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, RunResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate, IsolateEvent, IsolateRequest};
use once_cell::sync::Lazy;
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::exit,
    sync::Mutex,
};
use tokio::runtime::Handle;

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
const SUPPORT_FORMDATA: &str =
    include_str!("../../../tools/wpt/FileAPI/support/send-file-formdata-helper.js");

static RESULT: Lazy<Mutex<(usize, usize, usize)>> = Lazy::new(|| Mutex::new((0, 0, 0)));
static TEST_HARNESS: Lazy<String> = Lazy::new(|| {
    include_str!("../../../tools/wpt/resources/testharness.js")
        .to_owned()
        .replace("})(self);", "})(globalThis);")
        .replace("debug: false", "debug: true")
});

const SKIP_TESTS: [&str; 16] = [
    // request
    "request-error.any.js",         // "badRequestArgTests is not defined"
    "request-init-stream.any.js",   // "request.body.getReader is not a function"
    "request-consume-empty.any.js", // "Unexpected end of JSON input"
    "request-consume.any.js",       // "Unexpected end of JSON input"
    "request-init-priority.any.js", // "idx is not defined"
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
    // event
    "EventTarget-removeEventListener.any.js", // removeEventListener does not exists on the global object
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
    {SUPPORT_FORMDATA}
    {code}
    return new Response()
}}",
        TEST_HARNESS.as_str(),
    )
    .replace("self.", "globalThis.");

    let (tx, rx) = flume::unbounded();
    let (logs_sender, logs_receiver) = flume::unbounded();
    let handle = Handle::current();

    let join_handle = std::thread::spawn(move || {
        handle.block_on(async move {
            let mut isolate = Isolate::new(IsolateOptions::new(code).log_sender(logs_sender), rx);
            isolate.evaluate();
            isolate.run_event_loop().await;
        })
    });

    let log_handle = tokio::spawn(async move {
        while let Ok(log) = logs_receiver.recv_async().await {
            let content = log.1;

            if content.starts_with("TEST DONE 0") {
                RESULT.lock().unwrap().1 += 1;
                println!("{}", content.green());
            } else if content.starts_with("TEST DONE 1") {
                RESULT.lock().unwrap().2 += 1;
                println!("{}", content.red());
            } else if content.starts_with("TEST START") {
                RESULT.lock().unwrap().0 += 1;
            }
        }
    });

    let (request_tx, request_rx) = flume::unbounded();

    tx.send_async(IsolateEvent::Request(IsolateRequest {
        request: Request::default(),
        sender: request_tx,
    }))
    .await
    .unwrap();

    if let Ok(RunResult::Error(error)) = request_rx.recv_async().await {
        println!("{error}");
        exit(1);
    }

    tx.send_async(IsolateEvent::Terminate(String::from("Terminate")))
        .await
        .unwrap();

    join_handle.join().unwrap();
    log_handle.await.unwrap();
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
    let runtime = Runtime::new(RuntimeOptions::default().expose_gc(true));

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
        test_directory(Path::new("../../tools/wpt/FileAPI/file")).await;
        test_directory(Path::new("../../tools/wpt/FileAPI/reading-data-section")).await;
        test_directory(Path::new("../../tools/wpt/dom/events")).await;
        test_directory(Path::new("../../tools/wpt/urlpattern")).await;
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
