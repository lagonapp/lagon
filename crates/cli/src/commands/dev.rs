use anyhow::{Error, Result};
use chrono::offset::Local;
use colored::Colorize;
use envfile::EnvFile;
use hyper::body::Bytes;
use hyper::http::response::Builder;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{Request, Response, RunResult, StreamResult};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use log::{
    set_boxed_logger, set_max_level, Level, LevelFilter, Log, Metadata, Record, SetLoggerError,
};
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::convert::Infallible;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio_util::task::LocalPoolHandle;

use crate::utils::{
    bundle_function, error, info, input, success, validate_code_file, validate_public_dir, warn,
    Assets,
};

struct SimpleLogger;

impl Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let level = match record.level() {
                Level::Error => "ERROR".red(),
                Level::Warn => "WARN".yellow(),
                _ => "INFO".blue(),
            };

            println!("{} {}", level, record.args());
        }
    }

    fn flush(&self) {}
}

fn init_logger() -> Result<(), SetLoggerError> {
    set_boxed_logger(Box::new(SimpleLogger)).map(|()| set_max_level(LevelFilter::Info))?;
    Ok(())
}

fn parse_environment_variables(env: Option<PathBuf>) -> Result<HashMap<String, String>> {
    let mut environment_variables = HashMap::new();

    if let Some(path) = env {
        let envfile = EnvFile::new(path)?;

        for (key, value) in envfile.store {
            environment_variables.insert(key, value);
        }
    }

    Ok(environment_variables)
}

// This function is similar to packages/serverless/src/main.rs,
// expect that we don't have multiple deployments and such multiple
// threads to manage, and we don't manager logs and metrics.
async fn handle_request(
    req: HyperRequest<Body>,
    ip: String,
    content: Arc<Mutex<(Vec<u8>, Assets)>>,
    environment_variables: HashMap<String, String>,
    pool: LocalPoolHandle,
) -> Result<HyperResponse<Body>> {
    let mut url = req.uri().to_string();

    println!(
        "{} {} {}",
        format!("{}", Local::now().time()).black(),
        req.method().to_string().blue(),
        url
    );

    // Remove the leading '/' from the url
    url.remove(0);

    let (tx, rx) = flume::unbounded();
    let (index, assets) = content.lock().await.to_owned();

    if let Some(asset) = assets.iter().find(|asset| {
        asset.0.replace(".html", "") == url || asset.0.replace("/index.html", "") == url
    }) {
        println!("              {}", input("Asset found"));

        let content_type =
            Path::new(asset.0)
                .extension()
                .map_or("application/octet-stream", |extension| {
                    match extension.to_str().unwrap_or("") {
                        "js" => "application/javascript",
                        "css" => "text/css",
                        "html" => "text/html",
                        "png" => "image/png",
                        "jpg" => "image/jpeg",
                        "jpeg" => "image/jpeg",
                        "svg" => "image/svg+xml",
                        "json" => "application/json",
                        "txt" => "text/plain",
                        _ => "application/octet-stream",
                    }
                });

        let mut headers = HashMap::new();
        headers.insert("content-type".into(), content_type.into());

        let response = Response {
            status: 200,
            headers: Some(headers),
            body: Bytes::from(asset.1.clone()),
        };

        tx.send_async(RunResult::Response(response))
            .await
            .unwrap_or(());
    } else {
        match Request::from_hyper(req).await {
            Ok(mut request) => {
                request.add_header("X-Forwarded-For".into(), ip);

                pool.spawn_pinned_by_idx(
                    move || async move {
                        let mut isolate = Isolate::new(
                            IsolateOptions::new(
                                String::from_utf8(index).expect("Code is not UTF-8"),
                            )
                            .metadata(Some((String::from(""), String::from(""))))
                            .environment_variables(environment_variables),
                        );

                        isolate.run(request, tx).await;
                    },
                    0,
                );
            }
            Err(error) => {
                println!("Error while parsing request: {}", error);

                tx.send_async(RunResult::Error("Error while parsing request".into()))
                    .await
                    .unwrap_or(());
            }
        };
    }

    let result = rx.recv_async().await?;

    match result {
        RunResult::Stream(stream_result) => {
            let (stream_tx, stream_rx) = flume::unbounded::<Result<Bytes, std::io::Error>>();
            let body = Body::wrap_stream(stream_rx.into_stream());

            let (response_tx, response_rx) = flume::bounded(1);

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap_or(());
                }
                StreamResult::Data(bytes) => {
                    let bytes = Bytes::from(bytes);
                    stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                }
                StreamResult::Done => {
                    println!(
                        "{}",
                        error("The stream was done before sending a response/data")
                    );

                    // Close the stream by sending empty bytes
                    stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                }
            }

            tokio::spawn(async move {
                let mut done = false;

                while let Ok(result) = rx.recv_async().await {
                    match result {
                        RunResult::Stream(StreamResult::Start(response)) => {
                            response_tx.send_async(response).await.unwrap_or(());
                        }
                        RunResult::Stream(StreamResult::Data(bytes)) => {
                            if done {
                                println!("{}", error("Got data after stream was done"));

                                // Close the stream by sending empty bytes
                                stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                                break;
                            }

                            let bytes = Bytes::from(bytes);
                            stream_tx.send_async(Ok(bytes)).await.unwrap_or(());
                        }
                        _ => {
                            done = result == RunResult::Stream(StreamResult::Done);

                            if !done {
                                println!("{} {:?}", error("Unexpected stream result:"), result);
                            }

                            // Close the stream by sending empty bytes
                            stream_tx.send_async(Ok(Bytes::new())).await.unwrap_or(());
                        }
                    }
                }
            });

            let response = response_rx.recv_async().await?;
            let hyper_response = Builder::try_from(&response)?.body(body)?;

            Ok(hyper_response)
        }
        RunResult::Response(response) => {
            let hyper_response = Builder::try_from(&response)?.body(response.body.into())?;

            Ok(hyper_response)
        }
        RunResult::Timeout | RunResult::MemoryLimit => {
            if result == RunResult::Timeout {
                println!("{}", error("Function execution timed out"));
            } else {
                println!("{}", error("Function execution reached memory limit"));
            }

            Ok(HyperResponse::builder()
                .status(502)
                .body("Resources reached".into())?)
        }
        RunResult::Error(err) => {
            println!("{}", error(err.as_str()));

            Ok(HyperResponse::builder()
                .status(500)
                .body("Function error".into())?)
        }
        RunResult::NotFound => Ok(HyperResponse::builder()
            .status(404)
            .body("Deployment not found".into())?),
    }
}

pub async fn dev(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    port: Option<u16>,
    hostname: Option<String>,
    env: Option<PathBuf>,
    allow_code_generation: bool,
) -> Result<()> {
    validate_code_file(&file)?;

    let client = match client {
        Some(client) => {
            validate_code_file(&client)?;
            Some(client)
        }
        None => None,
    };

    let public_dir = validate_public_dir(public_dir)?;
    let (index, assets) = bundle_function(&file, &client, &public_dir)?;

    let content = Arc::new(Mutex::new((index, assets)));

    let runtime =
        Runtime::new(RuntimeOptions::default().allow_code_generation(allow_code_generation));
    let addr = format!(
        "{}:{}",
        hostname.unwrap_or_else(|| "127.0.0.1".into()),
        port.unwrap_or(1234)
    )
    .parse()?;

    let server_content = content.clone();
    let environment_variables = parse_environment_variables(env)?;
    let pool = LocalPoolHandle::new(1);

    let server = Server::bind(&addr).serve(make_service_fn(move |conn: &AddrStream| {
        let content = server_content.clone();
        let environment_variables = environment_variables.clone();
        let pool = pool.clone();

        let addr = conn.remote_addr();
        let ip = addr.ip().to_string();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(
                    req,
                    ip.clone(),
                    content.clone(),
                    environment_variables.clone(),
                    pool.clone(),
                )
            }))
        }
    }));

    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = RecommendedWatcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(1)),
    )?;

    let path = fs::canonicalize(&file)?;

    watcher.watch(path.parent().unwrap(), RecursiveMode::Recursive)?;

    let watcher_content = content.clone();

    tokio::spawn(async move {
        let content = watcher_content.clone();

        for _ in rx {
            // Clear the screen and put the cursor at first row & first col of the screen.
            print!("\x1B[2J\x1B[1;1H");
            println!("{}", info("Found change, updating..."));

            let (index, assets) = bundle_function(&file, &client, &public_dir)?;

            *content.lock().await = (index, assets);
        }

        Ok::<(), Error>(())
    });

    println!();
    println!("{}", success("Dev Server started!"));

    if allow_code_generation {
        println!(
            "{}",
            warn("Code generation is allowed due to `--allow-code-generation`")
        );
    }

    println!();
    println!(" {} http://{}", "➤".black(), format!("{}", addr).blue());
    println!();

    init_logger()?;
    server.await?;
    runtime.dispose();

    Ok(())
}
