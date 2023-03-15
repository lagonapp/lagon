use super::{PubSubListener, PubSubMessage};
use anyhow::Result;
use async_trait::async_trait;
use futures::{Stream, StreamExt};

pub struct FakePubSub {
    tx: flume::Sender<PubSubMessage>,
    rx: flume::Receiver<PubSubMessage>,
}

impl FakePubSub {
    pub fn new() -> Self {
        let (tx, rx) = flume::unbounded();

        Self { tx, rx }
    }

    pub fn get_tx(&self) -> flume::Sender<PubSubMessage> {
        self.tx.clone()
    }
}

impl Default for FakePubSub {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PubSubListener for FakePubSub {
    async fn connect(&mut self) -> Result<()> {
        Ok(())
    }

    fn get_stream(&mut self) -> Box<dyn Stream<Item = PubSubMessage> + Unpin + Send + '_> {
        Box::new(self.rx.clone().into_stream().boxed())
    }
}
