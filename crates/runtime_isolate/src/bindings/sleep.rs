use std::time::Duration;

use anyhow::{anyhow, Result};
use hyper::{client::HttpConnector, Body, Client};
use hyper_tls::HttpsConnector;
use lazy_static::lazy_static;

use crate::bindings::PromiseResult;

use super::BindingResult;

lazy_static! {
    static ref CLIENT: Client<HttpsConnector<HttpConnector>> =
        Client::builder().build::<_, Body>(HttpsConnector::new());
}

type Arg = u64;

pub fn sleep_init(scope: &mut v8::HandleScope, args: v8::FunctionCallbackArguments) -> Result<Arg> {
    match args.get(0).to_int32(scope) {
        Some(delay) => Ok(delay.value() as u64),
        None => Err(anyhow!("Invalid delay")),
    }
}

pub async fn sleep_binding(id: usize, arg: Arg) -> BindingResult {
    tokio::time::sleep(Duration::from_millis(arg)).await;

    BindingResult {
        id,
        result: PromiseResult::Undefined,
    }
}
