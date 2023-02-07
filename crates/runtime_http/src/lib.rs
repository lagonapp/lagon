use anyhow::{anyhow, Result};
use std::error::Error;

mod method;
mod request;
mod response;

use hyper::body::{to_bytes, Bytes, HttpBody};
pub use method::*;
pub use request::*;
pub use response::*;

pub trait IntoV8 {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object>;
}

pub trait FromV8: Sized {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        object: v8::Local<'a, v8::Value>,
    ) -> Result<Self>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StreamResult {
    Start(Response),
    Data(Vec<u8>),
    Done,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RunResult {
    Response(Response),
    Stream(StreamResult),
    Timeout,
    MemoryLimit,
    Error(String),
    NotFound,
}

impl RunResult {
    pub fn as_error(self) -> String {
        if let RunResult::Error(error) = self {
            return error;
        }

        panic!("RunResult is not an Error");
    }
}

const BODY_MAX_SIZE_BYTES: u64 = 1024 * 1024 * 10; // 10MB

pub async fn safe_to_bytes<B>(body: B) -> Result<Bytes>
where
    B: HttpBody,
    B::Error: Error + Send + Sync + 'static,
{
    let upper = body.size_hint().upper().unwrap_or(u64::MAX);

    if upper > BODY_MAX_SIZE_BYTES {
        return Err(anyhow!("Body size is too large"));
    }

    let full_body = to_bytes(body).await?;
    Ok(full_body)
}
