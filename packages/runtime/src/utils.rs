use std::collections::HashMap;

use anyhow::anyhow;

pub fn extract_v8_string(
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> anyhow::Result<String> {
    if let Some(value) = value.to_string(scope) {
        return Ok(value.to_rust_string_lossy(scope));
    }

    Err(anyhow!("Value is not a string"))
}

pub fn v8_string<'a>(scope: &mut v8::HandleScope<'a>, value: &str) -> v8::Local<'a, v8::String> {
    let value = v8::String::new(scope, value).unwrap();

    v8::Local::new(scope, value)
}

pub fn v8_integer<'a>(scope: &mut v8::HandleScope<'a>, value: i32) -> v8::Local<'a, v8::Integer> {
    let value = v8::Integer::new(scope, value);

    v8::Local::new(scope, value)
}

pub fn v8_uint8array<'a>(
    scope: &mut v8::HandleScope<'a>,
    value: Vec<u8>,
) -> v8::Local<'a, v8::Uint8Array> {
    let len = value.len();

    let backing_store = v8::ArrayBuffer::new_backing_store_from_boxed_slice(value.into());
    let backing_store_shared = backing_store.make_shared();
    let ab = v8::ArrayBuffer::with_backing_store(scope, &backing_store_shared);

    let value = v8::Uint8Array::new(scope, ab, 0, len).unwrap();

    v8::Local::new(scope, value)
}

pub fn v8_headers_object<'a>(
    scope: &mut v8::HandleScope<'a>,
    value: HashMap<String, String>,
) -> v8::Local<'a, v8::Object> {
    let headers = v8::Object::new(scope);

    for (key, value) in value.iter() {
        let key = v8_string(scope, key);
        let value = v8_string(scope, value);

        headers.set(scope, key.into(), value.into());
    }

    headers
}
