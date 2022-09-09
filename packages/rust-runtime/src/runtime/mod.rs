use v8::V8;

pub struct RuntimeOptions {
    allow_eval: bool,
}

impl Default for RuntimeOptions {
    fn default() -> Self {
        Self { allow_eval: false }
    }
}

pub struct Runtime;

unsafe impl Send for Runtime {}
unsafe impl Sync for Runtime {}

impl Runtime {
    pub fn new(options: RuntimeOptions) -> Self {
        let platform = v8::new_default_platform(0, false).make_shared();
        V8::initialize_platform(platform);
        V8::initialize();

        // Disable code generation from `eval(...)` / `new Function(...)`
        if !options.allow_eval {
            V8::set_flags_from_string("--disallow-code-generation-from-strings");
        }

        Runtime {}
    }

    pub fn dispose(&self) {
        unsafe {
            V8::dispose();
        }

        V8::dispose_platform();
    }
}

impl Drop for Runtime {
    fn drop(&mut self) {
        self.dispose();
    }
}
