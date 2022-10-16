mod request;
mod response;

pub use request::*;
pub use response::*;

pub trait IntoV8 {
    fn into_v8<'a>(self, scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::Object>;
}

pub trait FromV8: Sized {
    fn from_v8<'a>(
        scope: &mut v8::HandleScope<'a>,
        object: v8::Local<'a, v8::Value>,
    ) -> Option<Self>;
}

#[derive(Debug, Copy, Clone)]
pub enum Method {
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
    HEAD,
    OPTIONS,
}

impl From<Method> for &str {
    fn from(method: Method) -> &'static str {
        match method {
            Method::GET => "GET",
            Method::POST => "POST",
            Method::PUT => "PUT",
            Method::PATCH => "PATCH",
            Method::DELETE => "DELETE",
            Method::HEAD => "HEAD",
            Method::OPTIONS => "OPTIONS",
        }
    }
}

impl From<&str> for Method {
    fn from(method: &str) -> Method {
        match method {
            "POST" => Method::POST,
            "PUT" => Method::PUT,
            "PATCH" => Method::PATCH,
            "DELETE" => Method::DELETE,
            "HEAD" => Method::HEAD,
            "OPTIONS" => Method::OPTIONS,
            _ => Method::GET,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StreamResult {
    Start(Response),
    Data(&'static [u8]),
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
