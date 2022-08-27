pub fn extract_v8_string(
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> Option<String> {
    if let Some(value) = value.to_string(scope) {
        return Some(value.to_rust_string_lossy(scope));
    }

    None
}
