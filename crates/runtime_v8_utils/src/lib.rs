use std::collections::HashMap;

use anyhow::{anyhow, Result};
use hyper::{header::HeaderName, http::HeaderValue, HeaderMap};
use serde_json::{Map, Value};

const X_LAGON_ID: &str = "x-lagon-id";

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
    if !value.is_map() {
        return Err(anyhow!("Value is not of type 'Map'"));
    }

    let map = unsafe { v8::Local::<v8::Map>::cast(value) };

    if map.size() > 0 {
        let headers_keys = map.as_array(scope);
        let length = headers_keys.length();

        for mut index in 0..length {
            if index % 2 != 0 {
                continue;
            }

            let key = headers_keys
                .get_index(scope, index)
                .map_or_else(String::new, |key| key.to_rust_string_lossy(scope));

            index += 1;

            for value in headers_keys.get_index(scope, index).into_iter() {
                if value.is_array() {
                    let values = unsafe { v8::Local::<v8::Array>::cast(value) };

                    for i in 0..values.length() {
                        let value = values
                            .get_index(scope, i)
                            .map_or_else(String::new, |value| value.to_rust_string_lossy(scope));

                        header_map.append(HeaderName::from_bytes(key.as_bytes())?, value.parse()?);
                    }
                } else {
                    let value = value.to_rust_string_lossy(scope);

                    header_map.append(HeaderName::from_bytes(key.as_bytes())?, value.parse()?);
                }
            }
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
) -> v8::Local<'a, v8::Object> {
    let len = value.len();

    let mut names = Vec::with_capacity(len);
    let mut values = Vec::with_capacity(len);

    for key in value.keys() {
        if key != X_LAGON_ID {
            // We guess that most of the time there will be only one header value
            let mut elements = Vec::with_capacity(1);

            for value in value.get_all(key) {
                elements.push(v8_string(scope, value.to_str().unwrap()).into())
            }

            let key = v8_string(scope, key.as_str());
            names.push(key.into());

            let array = v8::Array::new_with_elements(scope, &elements);
            values.push(array.into());
        }
    }

    let null = v8::null(scope).into();
    v8::Object::with_prototype_and_properties(scope, null, &names, &values)
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

struct JsonMap(Map<String, Value>);

impl Default for JsonMap {
    fn default() -> Self {
        JsonMap(Map::new())
    }
}

pub fn cache_response_to_v8<'a>(
    response: (Vec<u8>, Vec<u8>, u16, String),
    scope: &mut v8::HandleScope<'a>,
) -> v8::Local<'a, v8::Object> {
    let len = 4;
    let mut names = Vec::with_capacity(len);
    let mut values = Vec::with_capacity(len);

    names.push(v8_string(scope, "b").into());
    values.push(v8_string(scope, unsafe { std::str::from_utf8_unchecked(&response.1) }).into());

    names.push(v8_string(scope, "s").into());
    values.push(v8_integer(scope, response.2.into()).into());

    names.push(v8_string(scope, "st").into());
    values.push(v8_string(scope, &(response.3.as_str())).into());

    names.push(v8_string(scope, "h").into());

    let headers = {
        let headers_json: Value =
            serde_json::from_str(unsafe { std::str::from_utf8_unchecked(&response.0) })
                .unwrap_or_default();

        let map: HashMap<String, String> = match headers_json {
            Value::Object(obj) => obj
                .into_iter()
                .map(|(k, v)| (k, v.as_str().unwrap_or("").to_owned()))
                .collect(),
            _ => Default::default(),
        };
        let len = map.len();

        let mut names = Vec::with_capacity(len);
        let mut values = Vec::with_capacity(len);

        for key in map.keys() {
            if key != X_LAGON_ID {
                // We guess that most of the time there will be only one header value
                let mut elements = Vec::with_capacity(1);

                let value = match map.get(key) {
                    Some(v) => &*v.as_str(),
                    None => "",
                };

                elements.push(v8_string(scope, value).into());

                let key = v8_string(scope, key.as_str());
                names.push(key.into());

                let array = v8::Array::new_with_elements(scope, &elements);
                values.push(array.into());
            }
        }

        let null = v8::null(scope).into();
        v8::Object::with_prototype_and_properties(scope, null, &names, &values)
    };

    values.push(headers.into());

    let null = v8::null(scope).into();
    v8::Object::with_prototype_and_properties(scope, null, &names, &values)
}
