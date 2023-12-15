use super::CompressionFormat;
use super::CompressionInner;
use crate::Isolate;
use anyhow::Result;
use flate2::write::DeflateDecoder;
use flate2::write::DeflateEncoder;
use flate2::write::GzDecoder;
use flate2::write::GzEncoder;
use flate2::write::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use lagon_runtime_v8_utils::v8_exception;
use lagon_runtime_v8_utils::v8_string;
use uuid::Uuid;

fn compression_create(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<String> {
    let format_string = args.get(0).to_rust_string_lossy(scope);
    let format = CompressionFormat::try_from(format_string.as_str())?;
    let is_decoder = args.get(1).to_boolean(scope).is_true();
    let w = Vec::new();

    let inner = match format {
        CompressionFormat::Gz => match is_decoder {
            true => CompressionInner::GzDecoder(GzDecoder::new(w)),
            false => CompressionInner::GzEncoder(GzEncoder::new(w, Compression::default())),
        },
        CompressionFormat::Deflate => match is_decoder {
            true => CompressionInner::DeflateDecoder(ZlibDecoder::new(w)),
            false => CompressionInner::DeflateEncoder(ZlibEncoder::new(w, Compression::default())),
        },
        CompressionFormat::DeflateRaw => match is_decoder {
            true => CompressionInner::DeflateRawDecoder(DeflateDecoder::new(w)),
            false => {
                CompressionInner::DeflateRawEncoder(DeflateEncoder::new(w, Compression::default()))
            }
        },
    };

    let id = Uuid::new_v4().to_string();

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    state.compression_table.insert(id.clone(), inner);

    Ok(id)
}

pub fn compression_create_binding(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut retval: v8::ReturnValue,
) {
    match compression_create(scope, args) {
        Ok(res) => {
            retval.set(v8_string(scope, &res).into());
        }
        Err(err) => {
            let exception = v8_exception(scope, err.to_string().as_str());
            scope.throw_exception(exception);
        }
    }
}
