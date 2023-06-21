use anyhow::Result;
use futures::{Stream, StreamExt};
use std::pin::Pin;

use crate::{PubSubListener, PubSubMessage};

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

impl PubSubListener for FakePubSub {
    fn get_stream(&mut self) -> Result<Pin<Box<dyn Stream<Item = Result<PubSubMessage>>>>> {
        Ok(Box::pin(
            self.rx
                .clone()
                .into_stream()
                .map(|result| Ok(result))
                .boxed(),
        ))
    }
}
