use chrono::offset::Local;
use colored::Colorize;
use hyper::body::Bytes;
use hyper::http::response::Builder;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request as HyperRequest, Response as HyperResponse, Server};
use lagon_runtime::http::{Request, Response, RunResult, StreamResult};
use lagon_runtime::isolate::{Isolate, IsolateOptions};
use lagon_runtime::runtime::{Runtime, RuntimeOptions};
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::convert::Infallible;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use std::{io, path::PathBuf};
use tokio::sync::Mutex;

use crate::utils::{
    bundle_function, info, input, success, validate_code_file, validate_public_dir, FileCursor,
};

// This function is similar to packages/serverless/src/main.rs,
// expect that we don't have multiple deployments and such multiple
// threads to manage.
async fn handle_request(
    req: HyperRequest<Body>,
    content: Arc<Mutex<(FileCursor, HashMap<String, FileCursor>)>>,
) -> Result<HyperResponse<Body>, Infallible> {
    let mut url = req.uri().to_string();

    println!(
        "{} {} {}",
        format!("{}", Local::now().time()).black(),
        req.method().to_string().blue(),
        url
    );

    // Remove the leading '/' from the url
    url.remove(0);

    let (tx, rx) = flume::bounded(1);
    let (index, assets) = content.lock().await.to_owned();

    if let Some(asset) = assets.iter().find(|asset| *asset.0 == url) {
        println!("              {}", input("Asset found"));

        let extension = Path::new(asset.0).extension().unwrap().to_str().unwrap();
        let content_type = match extension {
            "js" => "application/javascript",
            "css" => "text/css",
            "html" => "text/html",
            "png" => "image/png",
            "jpg" => "image/jpeg",
            "jpeg" => "image/jpeg",
            "svg" => "image/svg+xml",
            "json" => "application/json",
            "txt" => "text/plain",
            _ => "text/plain",
        };

        let mut headers = HashMap::new();
        headers.insert("content-type".into(), content_type.into());

        let response = Response {
            status: 200,
            headers: Some(headers),
            body: Bytes::from(asset.1.get_ref().to_vec()),
        };

        tx.send_async(RunResult::Response(response)).await.unwrap();
    } else {
        let request = Request::from_hyper(req).await;

        let mut isolate = Isolate::new(IsolateOptions::new(
            String::from_utf8(index.get_ref().to_vec()).unwrap(),
        ));

        isolate.run(request, tx).await;
    }

    let result = rx.recv_async().await.unwrap();

    match result {
        RunResult::Stream(stream_result) => {
            let (mut sender, body) = Body::channel();

            let (response_tx, response_rx) = flume::bounded(1);
            let mut received_response = false;

            match stream_result {
                StreamResult::Start(response) => {
                    response_tx.send_async(response).await.unwrap();
                    received_response = true;
                }
                StreamResult::Data(bytes) => {
                    let bytes = Bytes::from(bytes);
                    sender.send_data(bytes).await.unwrap();
                }
                StreamResult::Done => panic!("Got a stream done without data"),
            }

            tokio::spawn(async move {
                while let Ok(RunResult::Stream(stream_result)) = rx.recv_async().await {
                    match stream_result {
                        StreamResult::Start(response) => {
                            response_tx.send_async(response).await.unwrap();
                            received_response = true;
                        }
                        StreamResult::Data(bytes) => {
                            let bytes = Bytes::from(bytes);
                            sender.send_data(bytes).await.unwrap();
                        }
                        StreamResult::Done => {
                            // Dropping the sender will end the body streaming,
                            // and we only want to drop it when the Response
                            // has been constructed
                            if received_response {
                                drop(sender);
                                break;
                            }
                        }
                    }
                }
            });

            let response = response_rx.recv_async().await.unwrap();

            let hyper_response = Builder::from(&response);
            let hyper_response = hyper_response.body(body).unwrap();

            Ok(hyper_response)
        }
        RunResult::Response(response) => {
            let hyper_response = Builder::from(&response);
            let hyper_response = hyper_response.body(response.body.into()).unwrap();

            Ok(hyper_response)
        }
        RunResult::Error(error) => Ok(HyperResponse::builder()
            .status(500)
            .body(error.into())
            .unwrap()),
        RunResult::Timeout => Ok(HyperResponse::new("Timeouted".into())),
        RunResult::MemoryLimit => Ok(HyperResponse::new("MemoryLimited".into())),
        RunResult::NotFound => Ok(HyperResponse::builder()
            .status(404)
            .body("Deployment not found".into())
            .unwrap()),
    }
}

pub async fn dev(
    file: PathBuf,
    client: Option<PathBuf>,
    public_dir: Option<PathBuf>,
    port: Option<u16>,
    hostname: Option<String>,
) -> io::Result<()> {
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

    let runtime = Runtime::new(RuntimeOptions::default());
    let addr = format!(
        "{}:{}",
        hostname.unwrap_or_else(|| "127.0.0.1".into()),
        port.unwrap_or(1234)
    )
    .parse()
    .unwrap();

    let server_content = content.clone();

    let server =
        Server::bind(&addr).serve(make_service_fn(move |_conn| {
            let content = server_content.clone();

            async move {
                Ok::<_, Infallible>(service_fn(move |req| handle_request(req, content.clone())))
            }
        }));

    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = RecommendedWatcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(1)),
    )
    .unwrap();

    let path = fs::canonicalize(&file)?;

    watcher
        .watch(path.parent().unwrap(), RecursiveMode::Recursive)
        .unwrap();

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

        Ok::<(), io::Error>(())
    });

    println!();
    println!("{}", success("Dev Server started!"));
    println!();
    println!(" {} http://{}", "➤".black(), format!("{}", addr).blue());
    println!();

    server.await.unwrap();
    runtime.dispose();

    Ok(())
}
