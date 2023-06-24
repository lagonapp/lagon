use std::io::Write;

use super::CompressionInner;
use crate::Isolate;
use anyhow::Result;
use lagon_runtime_v8_utils::{extract_v8_uint8array, v8_exception, v8_uint8array};

fn compression_write(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Vec<u8>> {
    let id = args.get(0).to_rust_string_lossy(scope);
    let input = extract_v8_uint8array(args.get(1))?;

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    let inner = match state.compression_table.get_mut(&id) {
        Some(inner) => inner,
        None => {
            return Err(anyhow::anyhow!("Compression {} not found", id));
        }
    };

    let out: Vec<u8> = match inner {
        CompressionInner::DeflateDecoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
        CompressionInner::DeflateEncoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
        CompressionInner::DeflateRawDecoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
        CompressionInner::DeflateRawEncoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
        CompressionInner::GzDecoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
        CompressionInner::GzEncoder(decoder) => {
            decoder.write_all(&input)?;
            decoder.flush()?;
            decoder.get_mut().drain(..)
        }
    }
    .collect();

    Ok(out.into())
}

pub fn compression_write_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    match compression_write(scope, args) {
        Ok(res) => {
            retval.set(v8_uint8array(scope, res).into());
        }
        Err(err) => {
            let exception = v8_exception(scope, err.to_string().as_str());
            scope.throw_exception(exception);
        }
    }
}
