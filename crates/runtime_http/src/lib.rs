use std::time::Duration;

use anyhow::Result;

mod headers;
mod method;
mod request;
mod response;

pub use headers::*;
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
    Done(Duration),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RunResult {
    Response(Response, Duration),
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
