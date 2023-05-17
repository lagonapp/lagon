use crate::utils::{bundle_function, resolve_path, Assets};
use anyhow::{anyhow, Error, Result};
use chrono::offset::Local;
use dialoguer::console::style;
use envfile::EnvFile;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_runtime_http::{RunResult, X_FORWARDED_FOR, X_LAGON_REGION};
use lagon_runtime_isolate::{options::IsolateOptions, Isolate};
use lagon_runtime_isolate::{IsolateEvent, IsolateRequest};
use lagon_runtime_utils::assets::{find_asset, handle_asset};
use lagon_runtime_utils::response::{handle_response, ResponseEvent, FAVICON_URL};
use notify::event::ModifyKind;
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::convert::Infallible;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::runtime::Handle;
use tokio::sync::Mutex;

const LOCAL_REGION: &str = "local";

fn parse_environment_variables(
    root: &Path,
    env: Option<PathBuf>,
) -> Result<HashMap<String, String>> {
    let mut environment_variables = HashMap::new();

    if let Some(path) = env {
        let envfile = EnvFile::new(root.join(path))?;

        for (key, value) in envfile.store {
            environment_variables.insert(key, value);
        }

        println!("{}", style("Loaded .env file...").black().bright());
    } else if let Ok(envfile) = EnvFile::new(root.join(".env")) {
        for (key, value) in envfile.store {
            environment_variables.insert(key, value);
        }

        println!(
            "{}",
            style("Automatically loaded .env file...").black().bright()
        );
    }

    Ok(environment_variables)
}

// This function is similar to packages/serverless/src/main.rs,
// except that we don't have multiple deployments and such multiple
// threads to manage, and we don't manager logs and metrics.
async fn handle_request(
    req: Request<Body>,
    public_dir: Option<PathBuf>,
    ip: String,
    assets: Arc<Mutex<Assets>>,
    isolate_tx: flume::Sender<IsolateEvent>,
) -> Result<Response<Body>> {
    let url = req.uri().path();

    let (tx, rx) = flume::unbounded();
    let assets = assets.lock().await.to_owned();

    let is_favicon = url == FAVICON_URL;

    if let Some(asset) = find_asset(url, &assets.keys().cloned().collect()) {
        println!(
            "{} {} {} {}",
            style(format!("{}", Local::now().time())).black().bright(),
            style(req.method().to_string()).blue(),
            style(url).black().bright(),
            style("(asset)").black().bright()
        );

        let run_result = match handle_asset(public_dir.unwrap(), asset) {
            Ok(response) => RunResult::Response(response, None),
            Err(error) => RunResult::Error(format!("Could not retrieve asset ({asset}): {error}")),
        };

        tx.send_async(run_result).await.unwrap_or(());
    } else if is_favicon {
        tx.send_async(RunResult::Response(
            Response::builder().status(404).body(Body::empty())?,
            None,
        ))
        .await
        .unwrap_or(());
    } else {
        println!(
            "{} {} {}",
            style(format!("{}", Local::now().time())).black().bright(),
            style(req.method().to_string()).blue(),
            url
        );

        let (mut parts, body) = req.into_parts();
        let body = hyper::body::to_bytes(body).await?.to_vec();

        parts.headers.insert(X_FORWARDED_FOR, ip.parse()?);
        parts.headers.insert(X_LAGON_REGION, LOCAL_REGION.parse()?);

        let request = (parts, body);

        isolate_tx
            .send_async(IsolateEvent::Request(IsolateRequest {
                request,
                sender: tx,
            }))
            .await
            .unwrap_or(());
    }

    handle_response(rx, |event| async move {
        match event {
            ResponseEvent::StreamDoneNoDataError => {
                println!(
                    "{} The stream was done before sending a response/data",
                    style("✕").red()
                );
            }
            ResponseEvent::UnexpectedStreamResult(result) => {
                println!(
                    "{} Unexpected stream result: {:?}",
                    style("✕").red(),
                    result
                );
            }
            ResponseEvent::LimitsReached(result) => {
                if result.is_timeout() {
                    println!("{} Function execution timed out", style("✕").red());
                } else {
                    println!(
                        "{} Function execution reached memory limit",
                        style("✕").red()
                    );
                }
            }
            ResponseEvent::Error(result) => {
                println!("{} {}", style("✕").red(), result.as_error().as_str());
            }
            _ => {}
        }

        Ok(())
    })
    .await
}

#[allow(clippy::too_many_arguments)]
pub async fn dev(
    path: Option<PathBuf>,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    port: Option<u16>,
    hostname: Option<String>,
    env: Option<PathBuf>,
    allow_code_generation: bool,
    prod: bool,
) -> Result<()> {
    let (root, function_config) = resolve_path(path, client, public_dir)?;
    let (index, assets) = bundle_function(&function_config, &root, prod)?;

    let server_index = index.clone();
    let assets = Arc::new(Mutex::new(assets));

    let runtime =
        Runtime::new(RuntimeOptions::default().allow_code_generation(allow_code_generation));
    let addr = format!(
        "{}:{}",
        hostname.unwrap_or_else(|| "127.0.0.1".into()),
        port.unwrap_or(1234)
    )
    .parse()?;

    let server_public_dir = function_config
        .assets
        .as_ref()
        .map(|assets| root.join(assets));

    let environment_variables = match parse_environment_variables(&root, env) {
        Ok(env) => env,
        Err(err) => return Err(anyhow!("Could not load environment variables: {:?}", err)),
    };

    let (tx, rx) = flume::unbounded();
    let (index_tx, index_rx) = flume::unbounded();
    let (log_sender, log_receiver) = flume::unbounded();
    let handle = Handle::current();

    std::thread::spawn(move || {
        handle.block_on(async move {
            let mut index = server_index;

            loop {
                let mut isolate = Isolate::new(
                    IsolateOptions::new(
                        String::from_utf8(index.clone()).expect("Code is not UTF-8"),
                    )
                    .tick_timeout(Duration::from_millis(500))
                    .total_timeout(Duration::from_secs(30))
                    .metadata(Some((String::from(""), String::from(""))))
                    .environment_variables(environment_variables.clone())
                    .log_sender(log_sender.clone()),
                    rx.clone(),
                );

                isolate.evaluate();

                tokio::select! {
                    _ = isolate.run_event_loop() => {},
                    new_index = index_rx.recv_async() => {
                        index = new_index.unwrap();
                    }
                }
            }
        });
    });

    tokio::spawn(async move {
        while let Ok(log) = log_receiver.recv_async().await {
            let (level, message, ..) = log;
            let level = match level.as_str() {
                "error" => style("ERROR".into()).red(),
                "warn" => style("WARN".into()).yellow(),
                _ => style(level.to_uppercase()).blue(),
            };

            println!("{} {}", level, message);
        }
    });

    let server_assets = Arc::clone(&assets);
    let server = Server::bind(&addr).serve(make_service_fn(move |conn: &AddrStream| {
        let public_dir = server_public_dir.clone();
        let assets = Arc::clone(&server_assets);
        let tx = tx.clone();

        let addr = conn.remote_addr();
        let ip = addr.ip().to_string();

        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_request(
                    req,
                    public_dir.clone(),
                    ip.clone(),
                    Arc::clone(&assets),
                    tx.clone(),
                )
            }))
        }
    }));

    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = RecommendedWatcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(1)),
    )?;

    watcher.watch(
        &root.join(function_config.index.clone()),
        RecursiveMode::NonRecursive,
    )?;

    tokio::spawn(async move {
        for event in rx.into_iter().flatten() {
            let should_update = if let EventKind::Modify(modify) = event.kind {
                matches!(modify, ModifyKind::Name(_)) || matches!(modify, ModifyKind::Data(_))
            } else {
                false
            };

            if should_update {
                // Clear the screen and put the cursor at first row & first col of the screen.
                print!("\x1B[2J\x1B[1;1H");
                println!("{}", style("File modified, updating...").black().bright());

                let (new_index, new_assets) = bundle_function(&function_config, &root, prod)?;

                *assets.lock().await = new_assets;
                index_tx.send_async(new_index).await.unwrap();

                println!();
                println!(" {} Dev Server ready!", style("◼").magenta());
                println!();
            }
        }

        Ok::<(), Error>(())
    });

    println!();
    println!(" {} Dev Server started!", style("◼").magenta());

    if allow_code_generation {
        println!(
            "   {} {}",
            style("Code generation is allowed due to").yellow(),
            style("--allow-code-generation").black().bright()
        );
    }

    println!();
    println!(
        "{} {}",
        style("›").black().bright(),
        style(format!("http://{addr}")).blue().underlined()
    );
    println!();

    server.await?;
    runtime.dispose();

    Ok(())
}
