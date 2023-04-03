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
    // Stream responses always have a duration
    // since they are always from the isolate
    Done(Duration),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RunResult {
    // Isolate responses have a duration (cpu time)
    // Assets responses don't
    Response(Response, Option<Duration>),
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

    pub fn as_response(self) -> Response {
        if let RunResult::Response(response, _) = self {
            return response;
        }

        panic!("RunResult is not a Response");
    }

    pub fn as_stream_done(self) -> bool {
        if let RunResult::Stream(StreamResult::Done(_)) = self {
            return true;
        }

        false
    }
}
