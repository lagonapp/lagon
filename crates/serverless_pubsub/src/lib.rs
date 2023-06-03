use anyhow::Result;
use async_trait::async_trait;
use futures::Stream;

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

#[async_trait]
pub trait PubSubListener: Send + Sized {
    async fn connect(&mut self) -> Result<()>;

    fn get_stream(&mut self) -> Box<dyn Stream<Item = PubSubMessage> + Unpin + Send + '_>;
}
