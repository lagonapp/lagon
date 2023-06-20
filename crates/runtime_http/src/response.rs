use anyhow::{anyhow, Result};
use hyper::{body::Bytes, http::response::Builder, Body, HeaderMap, Response};
use lagon_runtime_v8_utils::{
    extract_v8_headers_object, extract_v8_integer, extract_v8_string, v8_headers_object,
    v8_integer, v8_string,
};

pub fn response_to_v8<'a>(
    response: (u16, HeaderMap, Bytes),
    scope: &mut v8::HandleScope<'a>,
) -> v8::Local<'a, v8::Object> {
    let len = 3;
    let mut names = Vec::with_capacity(len);
    let mut values = Vec::with_capacity(len);

    names.push(v8_string(scope, "b").into());
    values.push(v8_string(scope, unsafe { std::str::from_utf8_unchecked(&response.2) }).into());

    names.push(v8_string(scope, "s").into());
    values.push(v8_integer(scope, response.0.into()).into());

    names.push(v8_string(scope, "h").into());
    values.push(v8_headers_object(scope, response.1).into());

    let null = v8::null(scope).into();
    v8::Object::with_prototype_and_properties(scope, null, &names, &values)
}

pub fn response_from_v8<'a>(
    scope: &mut v8::HandleScope<'a>,
    response: v8::Local<'a, v8::Value>,
) -> Result<(Builder, Body, bool)> {
    let response = match response.to_object(scope) {
        Some(response) => response,
        None => return Err(anyhow!("Response is not an object")),
    };

    let mut response_builder = Response::builder();

    let headers_key = v8_string(scope, "h");

    if let Some(headers_object) = response.get(scope, headers_key.into()) {
        if let Some(headers_object) = headers_object.to_object(scope) {
            if let Some(headers_value) = headers_object.get(scope, headers_key.into()) {
                if !headers_value.is_null_or_undefined() {
                    let headers_map = response_builder.headers_mut().unwrap();

                    extract_v8_headers_object(headers_map, headers_value, scope)?;
                }
            } else {
                return Err(anyhow!("Could not find headers object"));
            }
        } else {
            return Err(anyhow!("Could not find headers object"));
        }
    }

    let status_key = v8_string(scope, "s");

    match response.get(scope, status_key.into()) {
        Some(status_value) => {
            let status = extract_v8_integer(status_value, scope)? as u16;

            response_builder = response_builder.status(status);
        }
        None => return Err(anyhow!("Could not find status")),
    };

    let body_key = v8_string(scope, "b");

    return match response.get(scope, body_key.into()) {
        Some(body_value) => match body_value.is_null_or_undefined() {
            true => Ok((response_builder, Body::empty(), true)),
            false => {
                let body = extract_v8_string(body_value, scope)?;

                Ok((response_builder, body.into(), false))
            }
        },
        None => Err(anyhow!("Could not find body")),
    };
}
