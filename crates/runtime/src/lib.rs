use v8::V8;

pub mod options;

use self::options::RuntimeOptions;

#[repr(C, align(16))]
struct IcuData([u8; 10541264]);

static ICU_DATA: IcuData = IcuData(*include_bytes!("../icudtl.dat"));

const FLAGS: [&str; 0] = [];

pub struct Runtime;

impl Runtime {
    pub fn new(options: RuntimeOptions) -> Self {
        // Load ICU data to enable i18n, similar to Deno:
        // https://github.com/denoland/deno/blob/a55b194638bcaace38917703b7d9233fb1989d44/core/runtime.rs#L223
        v8::icu::set_common_data_72(&ICU_DATA.0).expect("Failed to load ICU data");

        let mut flags = FLAGS.join(" ");

        // Disable code generation from `eval` / `new Function`
        if !options.allow_code_generation {
            flags += " --disallow-code-generation-from-strings";
        }

        // Expose `globalThis.gc()` to trigger garbage collection
        if options.expose_gc {
            flags += " --expose-gc";
        }

        V8::set_flags_from_string(&flags);

        let platform = v8::new_default_platform(0, false).make_shared();
        V8::initialize_platform(platform);
        V8::initialize();

        Runtime
    }

    pub fn dispose(&self) {
        unsafe {
            V8::dispose();
        }

        V8::dispose_platform();
    }
}
