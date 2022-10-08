use v8::V8;

use crate::isolate::IsolateOptions;

#[repr(C, align(16))]
struct IcuData([u8; 10454784]);

static JS_RUNTIME: &str = include_str!("../../runtime.js");
static ICU_DATA: IcuData = IcuData(*include_bytes!("../../icudtl.dat"));

#[derive(Default)]
pub struct RuntimeOptions {
    allow_eval: bool,
}

pub struct Runtime;

impl Runtime {
    pub fn new(options: RuntimeOptions) -> Self {
        // Load ICU data to enable i18n, similar to Deno:
        // https://github.com/denoland/deno/blob/a55b194638bcaace38917703b7d9233fb1989d44/core/runtime.rs#L223
        v8::icu::set_common_data_71(&ICU_DATA.0).unwrap();

        // Disable code generation from `eval(...)` / `new Function(...)`
        if !options.allow_eval {
            V8::set_flags_from_string("--disallow-code-generation-from-strings");
        }

        let platform = v8::new_default_platform(0, false).make_shared();
        V8::initialize_platform(platform);
        V8::initialize();

        Runtime {}
    }

    pub fn dispose(&self) {
        unsafe {
            V8::dispose();
        }

        V8::dispose_platform();
    }
}

pub fn get_runtime_code<'a>(
    scope: &mut v8::HandleScope<'a>,
    options: &IsolateOptions,
) -> Option<v8::Local<'a, v8::String>> {
    let IsolateOptions {
        code,
        environment_variables,
        ..
    } = options;

    let environment_variables = match environment_variables {
        Some(environment_variables) => environment_variables
            .iter()
            .map(|(k, v)| format!("globalThis.process.env.{} = '{}'", k, v))
            .collect::<Vec<String>>()
            .join("\n"),
        None => "".to_string(),
    };

    v8::String::new(
        scope,
        &format!(
            r"{JS_RUNTIME}
{environment_variables}
{code}"
        ),
    )
}
