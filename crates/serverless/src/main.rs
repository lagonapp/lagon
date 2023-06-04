use anyhow::Result;
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_serverless::clickhouse::{create_client, run_migrations};
use lagon_serverless::deployments::get_deployments;
use lagon_serverless::serverless::start;
use lagon_serverless::REGION;
use lagon_serverless_downloader::{get_bucket, S3BucketDownloader};
use lagon_serverless_logger::init_logger;
use lagon_serverless_pubsub::RedisPubSub;
use log::info;
use metrics_exporter_prometheus::PrometheusBuilder;
use mysql::{Opts, Pool};
#[cfg(not(debug_assertions))]
use mysql::{OptsBuilder, SslOpts};
#[cfg(not(debug_assertions))]
use std::borrow::Cow;
use std::env;
use std::net::SocketAddr;
#[cfg(not(debug_assertions))]
use std::path::Path;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    // Only load a .env file on development
    #[cfg(debug_assertions)]
    dotenv::dotenv().expect("Failed to load .env file");

    let _flush_guard = init_logger(REGION.clone()).expect("Failed to init logger");

    let runtime = Runtime::new(RuntimeOptions::default());
    let addr: SocketAddr = env::var("LAGON_LISTEN_ADDR")
        .expect("LAGON_LISTEN_ADDR must be set")
        .parse()?;
    let prometheus_addr: SocketAddr = env::var("PROMETHEUS_LISTEN_ADDR")
        .expect("PROMETHEUS_LISTEN_ADDR must be set")
        .parse()?;

    let mut builder = PrometheusBuilder::new().with_http_listener(prometheus_addr);

    if let Ok(allowed_subnet) = env::var("PROMETHEUS_ALLOWED_SUBNET") {
        if !allowed_subnet.is_empty() {
            info!("Allowing Prometheus exporter to be accessed from {allowed_subnet}");

            builder = builder.add_allowed_address(allowed_subnet)?;
        }
    }

    builder.install().expect("Failed to start metrics exporter");

    let url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let url = url.as_str();
    let opts = Opts::from_url(url).expect("Failed to parse DATABASE_URL");
    #[cfg(not(debug_assertions))]
    let opts = OptsBuilder::from_opts(opts).ssl_opts(Some(SslOpts::default().with_root_cert_path(
        Some(Cow::from(Path::new("/etc/ssl/certs/ca-certificates.crt"))),
    )));
    let pool = Pool::new(opts)?;
    let conn = pool.get_conn()?;

    let bucket = get_bucket()?;
    let downloader = Arc::new(S3BucketDownloader::new(bucket));

    let url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let pubsub = RedisPubSub::new(url);

    let client = create_client();
    run_migrations(&client).await?;

    let deployments = get_deployments(conn, Arc::clone(&downloader)).await?;
    let serverless = start(deployments, addr, downloader, pubsub, client).await?;
    tokio::spawn(serverless).await?;

    runtime.dispose();

    Ok(())
}
