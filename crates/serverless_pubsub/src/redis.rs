use super::{PubSubListener, PubSubMessage, PubSubMessageKind};
use anyhow::Result;
use futures::Stream;
use log::info;
use redis::Client;
use std::pin::Pin;

pub struct RedisPubSub {
    client: Client,
}

impl RedisPubSub {
    pub fn new(url: String) -> Self {
        let client = Client::open(url).expect("Failed to open Redis Client");

        Self { client }
    }
}

impl PubSubListener for RedisPubSub {
    fn get_stream(&mut self) -> Result<Pin<Box<dyn Stream<Item = Result<PubSubMessage>>>>> {
        let mut connection = self.client.get_connection()?;

        let stream = async_stream::stream! {
            let mut pubsub = connection.as_pubsub();
            pubsub.set_read_timeout(None)?;

            info!("Redis Pub/Sub connected");

            pubsub.subscribe("deploy")?;
            pubsub.subscribe("undeploy")?;
            pubsub.subscribe("promote")?;

            loop {
                let msg = pubsub.get_message()?;
                let kind = PubSubMessageKind::from(msg.get_channel_name());
                let payload = msg.get_payload::<String>()?;

                yield Ok(PubSubMessage { kind, payload });
            }
        };

        Ok(Box::pin(stream))
    }
}
