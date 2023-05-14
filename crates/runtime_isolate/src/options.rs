use lagon_runtime_v8_utils::v8_string;
use std::{collections::HashMap, rc::Rc, time::Duration};

const JS_RUNTIME: &str = include_str!("../runtime.js");

pub type Metadata = Option<(String, String)>;
type OnIsolateDropCallback = Box<dyn Fn(Rc<Metadata>)>;
type OnIsolateStatisticsCallback = Box<dyn Fn(Rc<Metadata>, usize)>;

pub struct IsolateOptions {
    pub code: String,
    pub environment_variables: Option<HashMap<String, String>>,
    pub memory: usize, // in MB (MegaBytes)
    pub tick_timeout: Duration,
    pub total_timeout: Duration,
    pub statistics_interval: Duration,
    pub metadata: Rc<Metadata>,
    pub on_drop: Option<OnIsolateDropCallback>,
    pub on_statistics: Option<OnIsolateStatisticsCallback>,
    pub log_sender: Option<flume::Sender<(String, String, Metadata)>>,
    pub snapshot: bool,
    pub snapshot_blob: Option<&'static [u8]>,
}

unsafe impl Send for IsolateOptions {}

impl IsolateOptions {
    pub fn new(code: String) -> Self {
        Self {
            code,
            environment_variables: None,
            tick_timeout: Duration::from_millis(200),
            total_timeout: Duration::from_secs(1),
            statistics_interval: Duration::from_secs(1),
            memory: 128,
            metadata: Rc::new(None),
            on_drop: None,
            on_statistics: None,
            snapshot: false,
            snapshot_blob: None,
            log_sender: None,
        }
    }

    pub fn environment_variables(mut self, environment_variables: HashMap<String, String>) -> Self {
        self.environment_variables = Some(environment_variables);
        self
    }

    pub fn tick_timeout(mut self, tick_timeout: Duration) -> Self {
        self.tick_timeout = tick_timeout;
        self
    }

    pub fn total_timeout(mut self, total_timeout: Duration) -> Self {
        self.total_timeout = total_timeout;
        self
    }

    pub fn memory(mut self, memory: usize) -> Self {
        self.memory = memory;
        self
    }

    pub fn metadata(mut self, metadata: Metadata) -> Self {
        self.metadata = Rc::new(metadata);
        self
    }

    pub fn on_drop_callback(mut self, on_drop: OnIsolateDropCallback) -> Self {
        self.on_drop = Some(on_drop);
        self
    }

    pub fn on_statistics_callback(mut self, on_statistics: OnIsolateStatisticsCallback) -> Self {
        self.on_statistics = Some(on_statistics);
        self
    }

    pub fn log_sender(mut self, log_sender: flume::Sender<(String, String, Metadata)>) -> Self {
        self.log_sender = Some(log_sender);
        self
    }

    pub fn snapshot(mut self, snapshot: bool) -> Self {
        self.snapshot = snapshot;
        self
    }

    #[cfg(not(feature = "ignore-snapshot"))]
    pub fn snapshot_blob(mut self, snapshot_blob: &'static [u8]) -> Self {
        self.snapshot_blob = Some(snapshot_blob);
        self
    }

    #[cfg(feature = "ignore-snapshot")]
    pub fn snapshot_blob(mut self, snapshot_blob: &'static [u8]) -> Self {
        self
    }

    pub fn get_runtime_code<'a>(
        &self,
        scope: &mut v8::HandleScope<'a>,
    ) -> (v8::Local<'a, v8::String>, usize) {
        let IsolateOptions {
            code,
            environment_variables,
            snapshot,
            snapshot_blob,
            ..
        } = self;

        let environment_variables = match environment_variables {
            Some(environment_variables) => environment_variables
                .iter()
                .map(|(k, v)| format!("globalThis.process.env.{k} = '{v}'"))
                .collect::<Vec<String>>()
                .join("\n"),
            None => "".to_string(),
        };

        if snapshot_blob.is_some() {
            // If we have a snapshot, only return the isolate's code
            // and the environment variables
            (
                v8_string(
                    scope,
                    &format!(
                        r"{environment_variables}
{code}
globalThis.handler = handler;"
                    ),
                ),
                environment_variables.lines().count() + 1,
            )
        } else if *snapshot {
            // If we are currently making a snapshot, only return
            // the js runtime code
            (v8_string(scope, JS_RUNTIME), 0)
        } else {
            // Else, that means we don't care about snapshots at all
            // and we can return all the code
            (
                v8_string(
                    scope,
                    &format!(
                        r"{JS_RUNTIME}
{environment_variables}
{code}
globalThis.handler = handler;"
                    ),
                ),
                JS_RUNTIME.lines().count() + environment_variables.lines().count() + 2,
            )
        }
    }
}
