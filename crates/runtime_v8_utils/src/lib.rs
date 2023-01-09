use std::collections::HashMap;

use anyhow::{anyhow, Result};

pub fn extract_v8_string(
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> Result<String> {
    if let Some(value) = value.to_string(scope) {
        return Ok(value.to_rust_string_lossy(scope));
    }

    Err(anyhow!("Value is not a string"))
}

pub fn extract_v8_integer(value: v8::Local<v8::Value>, scope: &mut v8::HandleScope) -> Result<i64> {
    if let Some(value) = value.to_integer(scope) {
        return Ok(value.value());
    }

    Err(anyhow!("Value is not an integer"))
}

pub fn extract_v8_headers_object(
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> Result<Option<HashMap<String, String>>> {
    if !value.is_map() {
        return Err(anyhow!("Value is not of type 'Map'"));
    }

    let map = unsafe { v8::Local::<v8::Map>::cast(value) };

    if map.size() > 0 {
        let mut headers = HashMap::new();
        let headers_keys = map.as_array(scope);

        for mut index in 0..headers_keys.length() {
            if index % 2 != 0 {
                continue;
            }

            let key = headers_keys
                .get_index(scope, index)
                .map_or_else(|| "".to_string(), |key| key.to_rust_string_lossy(scope));
            index += 1;
            let value = headers_keys
                .get_index(scope, index)
                .map_or_else(|| "".to_string(), |value| value.to_rust_string_lossy(scope));

            headers.insert(key, value);
        }

        return Ok(Some(headers));
    }

    Ok(None)
}

pub fn extract_v8_uint8array(value: v8::Local<v8::Value>) -> Result<Vec<u8>> {
    if !value.is_uint8_array() {
        return Err(anyhow!("Value is not of type 'Uint8Array'"));
    }

    let chunk = unsafe { v8::Local::<v8::Uint8Array>::cast(value) };
    let mut buf = vec![0; chunk.byte_length()];
    chunk.copy_contents(&mut buf);

    Ok(buf)
}

pub fn v8_string<'a>(
    scope: &mut v8::HandleScope<'a, ()>,
    value: &str,
) -> v8::Local<'a, v8::String> {
    v8::String::new(scope, value).unwrap()
}

pub fn v8_integer<'a>(scope: &mut v8::HandleScope<'a>, value: i32) -> v8::Local<'a, v8::Integer> {
    v8::Integer::new(scope, value)
}

pub fn v8_uint8array<'a>(
    scope: &mut v8::HandleScope<'a>,
    value: Vec<u8>,
) -> v8::Local<'a, v8::Uint8Array> {
    let len = value.len();

    let backing_store = v8::ArrayBuffer::new_backing_store_from_boxed_slice(value.into());
    let backing_store_shared = backing_store.make_shared();
    let ab = v8::ArrayBuffer::with_backing_store(scope, &backing_store_shared);

    v8::Uint8Array::new(scope, ab, 0, len).unwrap()
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

pub fn v8_boolean<'a>(scope: &mut v8::HandleScope<'a>, value: bool) -> v8::Local<'a, v8::Boolean> {
    v8::Boolean::new(scope, value)
}

pub fn v8_exception<'a>(scope: &mut v8::HandleScope<'a>, value: &str) -> v8::Local<'a, v8::Value> {
    let message = v8_string(scope, value);
    v8::Exception::type_error(scope, message)
}
