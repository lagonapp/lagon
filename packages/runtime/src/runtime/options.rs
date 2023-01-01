#[derive(Default)]
pub struct RuntimeOptions {
    pub allow_code_generation: bool,
    pub expose_gc: bool,
}

impl RuntimeOptions {
    pub fn allow_code_generation(mut self, allow_code_generation: bool) -> Self {
        self.allow_code_generation = allow_code_generation;
        self
    }

    pub fn expose_gc(mut self, expose_gc: bool) -> Self {
        self.expose_gc = expose_gc;
        self
    }
}
