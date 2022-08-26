use std::time::Duration;

use crate::http::Response;

#[derive(Debug)]
pub enum RunResult {
    Response(Response, Duration),
    Timeout(),
    MemoryLimit(),
    Error(String),
}
