use clickhouse::{test::handlers, Client};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use lagon_serverless::clickhouse::{LogRow, RequestRow};
use std::sync::Once;

use crate::utils::mock::Mock;

mod mock;

pub fn setup() -> Client {
    static START: Once = Once::new();

    START.call_once(|| {
        dotenv::dotenv().expect("Failed to load .env file");

        Runtime::new(RuntimeOptions::default());
    });

    let mock = Mock::new();
    mock.add(handlers::record::<RequestRow>());
    mock.add(handlers::record::<LogRow>());
    Client::default().with_url(mock.url())
}
