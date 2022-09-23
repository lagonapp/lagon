use std::error::Error;

pub fn extract_v8_string(
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> Option<String> {
    if let Some(value) = value.to_string(scope) {
        return Some(value.to_rust_string_lossy(scope));
    }

    None
}

pub fn v8_string<'a>(
    scope: &mut v8::HandleScope<'a>,
    key: &str,
) -> Option<v8::Local<'a, v8::String>> {
    let value = v8::String::new(scope, key)?;
    let value = v8::Local::new(scope, value);

    Some(value)
}

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;
