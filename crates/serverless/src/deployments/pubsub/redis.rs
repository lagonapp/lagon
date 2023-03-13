use super::{PubSubListener, PubSubMessage};
use anyhow::Result;
use async_trait::async_trait;
use futures::{Stream, StreamExt};
use log::info;
use redis::{
    aio::{AsyncStream, PubSub},
    Client,
};
use std::pin::Pin;

pub struct RedisPubSub {
    client: Client,
    pubsub: Option<PubSub<Pin<Box<dyn AsyncStream + Send + Sync>>>>,
}

impl RedisPubSub {
    pub fn new(url: String) -> Self {
        let client = Client::open(url).expect("Failed to open Redis Client");

        Self {
            client,
            pubsub: None,
        }
    }
}

#[async_trait]
impl PubSubListener for RedisPubSub {
    async fn connect(&mut self) -> Result<()> {
        let connection = self.client.get_async_connection().await?;
        let mut pubsub = connection.into_pubsub();

        info!("Redis Pub/Sub connected");

        pubsub.subscribe("deploy").await?;
        pubsub.subscribe("undeploy").await?;
        pubsub.subscribe("promote").await?;

        self.pubsub = Some(pubsub);
        Ok(())
    }

    fn get_stream(
        &mut self,
    ) -> Box<dyn Stream<Item = (PubSubMessage, String)> + Unpin + Send + '_> {
        Box::new(self.pubsub.as_mut().unwrap().on_message().map(|msg| {
            let channel = msg.get_channel_name().to_string().into();
            let payload = msg.get_payload::<String>().unwrap();

            (channel, payload)
        }))
    }
}
