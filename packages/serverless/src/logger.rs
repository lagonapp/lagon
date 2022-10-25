use axiom_rs::Client;
use chrono::prelude::Local;
use flume::Sender;
use serde_json::{json, Value};

use log::{
    set_boxed_logger, set_max_level, warn, Level, LevelFilter, Log, Metadata, Record,
    SetLoggerError,
};
struct SimpleLogger {
    tx: Sender<Value>,
}

impl SimpleLogger {
    pub fn new() -> Self {
        let (tx, rx) = flume::unbounded();

        // Axiom is optional
        match Client::new() {
            Ok(axiom_client) => {
                tokio::spawn(async move {
                    // TODO: batch values
                    let value = rx.recv().unwrap();
                    axiom_client
                        .datasets
                        .ingest("serverless", vec![value])
                        .await
                        .unwrap();
                });
            }
            Err(e) => {
                warn!("Axiom is not configured: {}", e);
            }
        }

        Self { tx }
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
            if !self.tx.is_disconnected() {
                self.tx
                    .send(json!({
                        "region": dotenv::var("LAGON_REGION").expect("LAGON_REGION must be set"),
                        "timestamp": Local::now().to_rfc3339(),
                        "level": record.level().to_string(),
                        "message": record.args().to_string(),
                    }))
                    .unwrap_or(())
            }
        }
    }

    fn flush(&self) {
        warn!("Flushing not implemented");
    }
}

pub fn init_logger() -> Result<(), SetLoggerError> {
    set_boxed_logger(Box::new(SimpleLogger::new())).map(|()| set_max_level(LevelFilter::Info))
}
