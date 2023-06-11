use anyhow::Result;
use futures::Stream;
use std::pin::Pin;

mod fake;
mod redis;

pub use crate::redis::RedisPubSub;
pub use fake::FakePubSub;

#[derive(Debug, PartialEq)]
pub enum PubSubMessageKind {
    Deploy,
    Undeploy,
    Promote,
    Unknown,
}

pub struct PubSubMessage {
    pub kind: PubSubMessageKind,
    pub payload: String,
}

impl PubSubMessage {
    pub fn new(kind: PubSubMessageKind, payload: String) -> Self {
        Self { kind, payload }
    }
}

impl From<String> for PubSubMessageKind {
    fn from(value: String) -> Self {
        match value.as_str() {
            "deploy" => Self::Deploy,
            "undeploy" => Self::Undeploy,
            "promote" => Self::Promote,
            _ => Self::Unknown,
        }
    }
}

pub trait PubSubListener: Send {
    fn get_stream(&mut self) -> Result<Pin<Box<dyn Stream<Item = Result<PubSubMessage>>>>>;
}
