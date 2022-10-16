mod method;
mod request;
mod response;

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
    ) -> Option<Self>;
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
