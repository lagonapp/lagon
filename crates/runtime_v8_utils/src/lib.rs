use anyhow::{anyhow, Result};
use v8::{HandleScope, Local, ObjectTemplate, READ_ONLY};

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
) -> Result<Option<Vec<(String, Vec<String>)>>> {
    if !value.is_map() {
        return Err(anyhow!("Value is not of type 'Map'"));
    }

    let map = unsafe { v8::Local::<v8::Map>::cast(value) };

    if map.size() > 0 {
        let headers_keys = map.as_array(scope);
        let length = headers_keys.length();
        let mut headers = Vec::with_capacity((length / 2) as usize);

        for mut index in 0..length {
            if index % 2 != 0 {
                continue;
            }

            let key = headers_keys
                .get_index(scope, index)
                .map_or_else(String::new, |key| key.to_rust_string_lossy(scope));

            index += 1;

            let values = headers_keys
                .get_index(scope, index)
                .map_or_else(Vec::new, |value| {
                    let mut result = Vec::new();

                    if value.is_array() {
                        let values = unsafe { v8::Local::<v8::Array>::cast(value) };

                        for i in 0..values.length() {
                            let value = values
                                .get_index(scope, i)
                                .map_or_else(String::new, |value| {
                                    value.to_rust_string_lossy(scope)
                                });

                            result.push(value);
                        }
                    } else {
                        let value = value.to_rust_string_lossy(scope);

                        result.push(value);
                    }

                    result
                });

            headers.push((key, values));
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
    value: Vec<(String, Vec<String>)>,
) -> v8::Local<'a, v8::Object> {
    let len = value.len();

    let mut names = Vec::with_capacity(len);
    let mut values = Vec::with_capacity(len);

    for (key, headers) in value.iter() {
        let key = v8_string(scope, key);

        let mut elements = Vec::with_capacity(headers.len());

        for header in headers.iter() {
            elements.push(v8_string(scope, header).into())
        }

        let array = v8::Array::new_with_elements(scope, &elements);

        names.push(key.into());
        values.push(array.into());
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

    Err(anyhow!("Value is not an integer"))
}

pub fn create_object_under<'s>(
    scope: &mut HandleScope<'s>,
    target: Local<v8::Object>,
    name: &'static str,
) -> v8::Local<'s, v8::Object> {
    let template = ObjectTemplate::new(scope);
    let key = v8::String::new(scope, name).unwrap();
    let value = template.new_instance(scope).unwrap();
    target.set(scope, key.into(), value.into());
    value
}

/// get property getter，setter
pub fn set_accessor_to<'s, GetterF, SetterF>(
    scope: &mut HandleScope<'s>,
    target: Local<v8::Object>,
    name: &'static str,
    getter: GetterF,
    setter: SetterF,
) where
    GetterF: Sized
        + Copy
        + Fn(
            &mut v8::HandleScope,
            v8::Local<v8::Name>,
            v8::PropertyCallbackArguments,
            v8::ReturnValue,
        ),
    SetterF: Sized
        + Copy
        + Fn(
            &mut v8::HandleScope,
            v8::Local<v8::Name>,
            v8::Local<v8::Value>,
            v8::PropertyCallbackArguments,
        ),
{
    let key = v8::String::new(scope, name).unwrap();
    target.set_accessor_with_setter(scope, key.into(), getter, setter);
}

/// binding func
pub fn set_function_to(
    scope: &mut v8::HandleScope<'_>,
    target: v8::Local<v8::Object>,
    name: &'static str,
    callback: impl v8::MapFnTo<v8::FunctionCallback>,
) {
    let key = v8::String::new(scope, name).unwrap();
    let tmpl = v8::FunctionTemplate::new(scope, callback);
    let val = tmpl.get_function(scope).unwrap();
    target.set(scope, key.into(), val.into());
}

// set key，value to obj
pub fn set_property_to<'s>(
    scope: &mut v8::HandleScope<'s>,
    target: v8::Local<v8::Object>,
    name: &'static str,
    value: v8::Local<v8::Value>,
) {
    let key = v8::String::new(scope, name).unwrap();
    target.set(scope, key.into(), value.into());
}

// set readonly property
pub fn set_constant_to<'s>(
    scope: &mut v8::HandleScope<'s>,
    target: v8::Local<v8::Object>,
    name: &str,
    cvalue: v8::Local<v8::Value>,
) {
    let key = v8::String::new(scope, name).unwrap();
    target.define_own_property(scope, key.into(), cvalue, READ_ONLY);
}
