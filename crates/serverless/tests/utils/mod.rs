use clickhouse::{test::Mock, Client};
use lagon_runtime::{options::RuntimeOptions, Runtime};
use std::sync::Once;

pub fn setup() -> Client {
    static START: Once = Once::new();

    START.call_once(|| {
        dotenv::dotenv().expect("Failed to load .env file");

        Runtime::new(RuntimeOptions::default());
    });

    let mock = Mock::new();
    Client::default().with_url(mock.url())
}
