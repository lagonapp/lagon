use super::CompressionInner;
use crate::Isolate;
use anyhow::Result;
use lagon_runtime_v8_utils::{v8_exception, v8_uint8array};

fn compression_finish(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Vec<u8>> {
    let id = args.get(0).to_rust_string_lossy(scope);

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    let inner = match state.compression_table.remove(&id) {
        Some(inner) => inner,
        None => {
            return Err(anyhow::anyhow!("Compression {} not found", id));
        }
    };

    let out: Vec<u8> = match inner {
        CompressionInner::DeflateDecoder(decoder) => decoder.finish()?,
        CompressionInner::DeflateEncoder(decoder) => decoder.finish()?,
        CompressionInner::DeflateRawDecoder(decoder) => decoder.finish()?,
        CompressionInner::DeflateRawEncoder(decoder) => decoder.finish()?,
        CompressionInner::GzDecoder(decoder) => decoder.finish()?,
        CompressionInner::GzEncoder(decoder) => decoder.finish()?,
    };

    Ok(out.into())
}

pub fn compression_finish_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    match compression_finish(scope, args) {
        Ok(res) => {
            retval.set(v8_uint8array(scope, res).into());
        }
        Err(err) => {
            let exception = v8_exception(scope, err.to_string().as_str());
            scope.throw_exception(exception);
        }
    }
}
