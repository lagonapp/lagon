use anyhow::Result;
use log::info;
use std::{collections::HashMap, sync::Arc};
use tokio_cron_scheduler::{Job, JobScheduler};
use uuid::Uuid;

use crate::deployments::Deployment;

pub struct Cronjob {
    jobs: HashMap<String, Uuid>,
    scheduler: JobScheduler,
}

impl Cronjob {
    pub async fn new() -> Self {
        let scheduler = JobScheduler::new().await.unwrap();
        scheduler.start().await.unwrap();

        Self {
            jobs: HashMap::new(),
            scheduler,
        }
    }

    pub async fn add(&mut self, deployment: Arc<Deployment>) -> Result<()> {
        if let Some(cron) = &deployment.cron {
            // Adding a 0 at the beginning because tokio-cron-scheduler's
            // cron format include seconds at the start
            let cron = format!("0 {}", cron);

            info!("Registering cron {} for deployment {}", cron, deployment.id);

            let uuid = self
                .scheduler
                .add(Job::new_async(cron.as_str(), |_, _| {
                    Box::pin(async {
                        // TODO: run the isolate and handle the result
                        println!("Running");
                    })
                })?)
                .await?;

            self.jobs.insert(deployment.id.clone(), uuid);
        }

        Ok(())
    }

    pub async fn remove(&mut self, deployment_id: String) -> Result<()> {
        if let Some(uuid) = self.jobs.remove(&deployment_id) {
            info!("Unregistering cron for deployment {}", deployment_id);

            self.scheduler.remove(&uuid).await?;
        }

        Ok(())
    }
}
