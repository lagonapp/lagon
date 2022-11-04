use axiom_rs::Client;
use chrono::prelude::Local;
use flume::Sender;
use serde_json::{json, Value};
use std::sync::{Arc, RwLock};

use log::{
    set_boxed_logger, set_max_level, Level, LevelFilter, Log, Metadata, Record, SetLoggerError,
};
struct SimpleLogger {
    tx: Arc<RwLock<Option<Sender<Value>>>>,
}

impl SimpleLogger {
    pub fn new() -> Self {
        let (tx, rx) = flume::unbounded();

        // Axiom is optional
        match Client::new() {
            Ok(axiom_client) => {
                tokio::spawn(async move {
                    if let Err(error) = axiom_client
                        .datasets
                        .ingest_stream("serverless", rx.into_stream())
                        .await
                    {
                        eprintln!("Error ingesting into Axiom: {}", error);
                    }
                });
            }
            Err(error) => println!("Axiom is not configured: {}", error),
        }

        Self {
            tx: Arc::new(RwLock::new(Some(tx))),
        }
    }
}

impl Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            println!("{} - {} - {}", Local::now(), record.level(), record.args());

            // Axiom is optional, so tx can have no listeners
            let tx = self.tx.read().expect("Tx lock is poisoned");
            if let Some(tx) = &*tx {
                if !tx.is_disconnected() {
                    tx.send(json!({
                        "region": dotenv::var("LAGON_REGION").expect("LAGON_REGION must be set"),
                        "_time": Local::now().to_rfc3339(),
                        "level": record.level().to_string(),
                        "message": record.args().to_string(),
                    }))
                    .unwrap_or(())
                }
            }
        }
    }

    fn flush(&self) {
        let mut tx = self.tx.write().expect("Tx lock is poisoned");
        tx.take();
    }
}

pub struct FlushGuard;

impl Drop for FlushGuard {
    fn drop(&mut self) {
        log::logger().flush()
    }
}

pub fn init_logger() -> Result<FlushGuard, SetLoggerError> {
    set_boxed_logger(Box::new(SimpleLogger::new())).map(|()| set_max_level(LevelFilter::Info))?;
    Ok(FlushGuard)
}
