use hyper::{http::response::Builder, Body, Response};
use std::time::Duration;

mod headers;
mod request;
mod response;

pub use headers::*;
pub use request::*;
pub use response::*;

#[derive(Debug)]
pub enum StreamResult {
    Start(Builder),
    Data(Vec<u8>),
    // Stream responses always have a duration
    // since they are always from the isolate
    Done(Duration),
}

#[derive(Debug)]
pub enum RunResult {
    // Isolate responses have a duration (cpu time)
    // Assets responses don't
    Response(Response<Body>, Option<Duration>),
    Stream(StreamResult),
    Timeout,
    MemoryLimit,
    Error(String),
}

impl RunResult {
    pub fn is_timeout(&self) -> bool {
        matches!(self, RunResult::Timeout)
    }

    pub fn is_memory_limit(&self) -> bool {
        matches!(self, RunResult::MemoryLimit)
    }

    pub fn as_error(self) -> String {
        if let RunResult::Error(error) = self {
            return error;
        }

        panic!("RunResult is not an Error: {:?}", self);
    }

    pub fn as_response(self) -> Response<Body> {
        if let RunResult::Response(response, _) = self {
            return response;
        }

        panic!("RunResult is not a Response: {:?}", self);
    }

    pub fn as_stream_done(self) -> bool {
        if let RunResult::Stream(StreamResult::Done(_)) = self {
            return true;
        }

        false
    }
}
