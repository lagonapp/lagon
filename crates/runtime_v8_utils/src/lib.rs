use anyhow::{anyhow, Result};
use hyper::{header::HeaderName, http::HeaderValue, HeaderMap};

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
    header_map: &mut HeaderMap,
    value: v8::Local<v8::Value>,
    scope: &mut v8::HandleScope,
) -> Result<()> {
    if !value.is_array() {
        return Err(anyhow!("Value is not of type 'Array'"));
    }

    let array = unsafe { v8::Local::<v8::Array>::cast(value) };

    for index in 0..array.length() {
        if let Some(entry) = array.get_index(scope, index) {
            if !entry.is_array() {
                return Err(anyhow!("Value is not of type 'Array'"));
            }

            let entry = unsafe { v8::Local::<v8::Array>::cast(entry) };

            if entry.length() != 2 {
                return Err(anyhow!("Entry length is not 2"));
            }

            let key = entry
                .get_index(scope, 0)
                .map_or_else(String::new, |key| key.to_rust_string_lossy(scope));

            let value = entry
                .get_index(scope, 1)
                .map_or_else(String::new, |value| value.to_rust_string_lossy(scope));

            header_map.append(HeaderName::from_bytes(key.as_bytes())?, value.parse()?);
        }
    }

    Ok(())
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
    value: HeaderMap<HeaderValue>,
) -> v8::Local<'a, v8::Array> {
    let mut elements = Vec::with_capacity(value.len());

    for key in value.keys() {
        let keypair = [
            v8_string(scope, key.as_str()).into(),
            v8_string(scope, value.get(key).unwrap().to_str().unwrap()).into(),
        ];

        let keypair = v8::Array::new_with_elements(scope, &keypair);
        elements.push(keypair.into());
    }

    v8::Array::new_with_elements(scope, &elements)
}

pub fn v8_boolean<'a>(scope: &mut v8::HandleScope<'a>, value: bool) -> v8::Local<'a, v8::Boolean> {
    v8::Boolean::new(scope, value)
}

pub fn v8_exception<'a>(scope: &mut v8::HandleScope<'a>, value: &str) -> v8::Local<'a, v8::Value> {
    let message = v8_string(scope, value);
    v8::Exception::type_error(scope, message)
}

pub fn extract_v8_uint32(scope: &mut v8::HandleScope, value: v8::Local<v8::Value>) -> Result<u32> {
    if let Some(value) = value.to_uint32(scope) {
        return Ok(value.value());
    }

    Err(anyhow!("Value is not an uint32"))
}
