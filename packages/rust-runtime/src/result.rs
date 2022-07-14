use std::time::Duration;

#[derive(Debug, PartialEq)]
pub enum RunResult {
    Response(String, Duration),
    Timeout(),
    MemoryLimit(),
    Error(String),
}
