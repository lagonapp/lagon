use std::collections::HashMap;
use std::time::Duration;

#[derive(Debug)]
pub enum Method {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    HEAD,
    OPTIONS,
}

impl Into<&str> for Method {
    fn into(self) -> &'static str {
        match self {
            Self::GET => "GET",
            Self::POST => "POST",
            Self::PUT => "PUT",
            Self::PATCH => "PATCH",
            Self::DELETE => "DELETE",
            Self::HEAD => "HEAD",
            Self::OPTIONS => "OPTIONS",
        }
    }
}

#[derive(Debug)]
pub struct Request {
    pub headers: HashMap<String, String>,
    pub method: Method,
    pub body: String,
}

#[derive(Debug)]
pub struct Response {
    pub headers: Option<HashMap<String, String>>,
    pub body: String,
    pub status: u16,
}

#[derive(Debug)]
pub enum RunResult {
    Response(Response, Duration),
    Timeout(),
    MemoryLimit(),
    Error(String),
}
