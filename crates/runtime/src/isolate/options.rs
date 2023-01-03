use lagon_runtime_v8_utils::v8_string;
use std::{collections::HashMap, rc::Rc};

use super::IsolateStatistics;

const JS_RUNTIME: &str = include_str!("../../runtime.js");

pub type Metadata = Option<(String, String)>;
type OnIsolateDropCallback = Box<dyn Fn(Rc<Metadata>)>;
type OnIsolateStatisticsCallback = Box<dyn Fn(Rc<Metadata>, IsolateStatistics)>;

pub struct IsolateOptions {
    pub code: String,
    pub environment_variables: Option<HashMap<String, String>>,
    pub memory: usize,          // in MB (MegaBytes)
    pub timeout: usize,         // in ms (MilliSeconds)
    pub startup_timeout: usize, // is ms (MilliSeconds)
    pub metadata: Rc<Metadata>,
    pub on_drop: Option<OnIsolateDropCallback>,
    pub on_statistics: Option<OnIsolateStatisticsCallback>,
    // pub snapshot_blob: Option<Box<dyn Allocated<[u8]>>>,
}

impl IsolateOptions {
    pub fn new(code: String) -> Self {
        Self {
            code,
            environment_variables: None,
            timeout: 50,
            startup_timeout: 200,
            memory: 128,
            metadata: Rc::new(None),
            on_drop: None,
            on_statistics: None,
            // snapshot_blob: None,
        }
    }

    pub fn environment_variables(mut self, environment_variables: HashMap<String, String>) -> Self {
        self.environment_variables = Some(environment_variables);
        self
    }

    pub fn timeout(mut self, timeout: usize) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn startup_timeout(mut self, startup_timeout: usize) -> Self {
        self.startup_timeout = startup_timeout;
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

    pub fn get_runtime_code<'a>(
        &self,
        scope: &mut v8::HandleScope<'a>,
    ) -> v8::Local<'a, v8::String> {
        let IsolateOptions {
            code,
            environment_variables,
            ..
        } = self;

        let environment_variables = match environment_variables {
            Some(environment_variables) => environment_variables
                .iter()
                .map(|(k, v)| format!("globalThis.process.env.{} = '{}'", k, v))
                .collect::<Vec<String>>()
                .join("\n"),
            None => "".to_string(),
        };

        v8_string(
            scope,
            &format!(
                r"{JS_RUNTIME}
    {environment_variables}
    {code}"
            ),
        )
    }
}
