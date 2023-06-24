use anyhow::{anyhow, Result};
use lagon_runtime_v8_utils::extract_v8_uint8array;
use lagon_runtime_v8_utils::v8_string;
use lagon_runtime_v8_utils::v8_uint8array;
use std::io::Write;
use uuid::Uuid;

use lagon_runtime_v8_utils::v8_exception;

use flate2::write::DeflateDecoder;
use flate2::write::DeflateEncoder;
use flate2::write::GzDecoder;
use flate2::write::GzEncoder;
use flate2::write::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;

use crate::Isolate;

#[derive(Debug)]
pub enum CompressionInner {
    DeflateDecoder(ZlibDecoder<Vec<u8>>),
    DeflateEncoder(ZlibEncoder<Vec<u8>>),
    DeflateRawDecoder(DeflateDecoder<Vec<u8>>),
    DeflateRawEncoder(DeflateEncoder<Vec<u8>>),
    GzDecoder(GzDecoder<Vec<u8>>),
    GzEncoder(GzEncoder<Vec<u8>>),
}

enum CompressionFormat {
    Gz,
    Deflate,
    DeflateRaw,
}

fn get_compression_format(str: &str) -> Result<CompressionFormat> {
    match str {
        "gzip" => Ok(CompressionFormat::Gz),
        "deflate" => Ok(CompressionFormat::Deflate),
        "deflate-raw" => Ok(CompressionFormat::DeflateRaw),
        _ => Err(anyhow!("Algorithm not supported")),
    }
}

fn compression_create(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<String> {
    let format_string = args.get(0).to_rust_string_lossy(scope);
    let format = get_compression_format(&format_string)?;
    let is_decoder = args.get(1).to_boolean(scope);
    let w = Vec::new();

    let inner = match format {
        CompressionFormat::Gz => {
            if is_decoder.is_true() {
                CompressionInner::GzDecoder(GzDecoder::new(w))
            } else {
                CompressionInner::GzEncoder(GzEncoder::new(w, Compression::default()))
            }
        }
        CompressionFormat::Deflate => {
            if is_decoder.is_true() {
                CompressionInner::DeflateDecoder(ZlibDecoder::new(w))
            } else {
                CompressionInner::DeflateEncoder(ZlibEncoder::new(w, Compression::default()))
            }
        }
        CompressionFormat::DeflateRaw => {
            if is_decoder.is_true() {
                CompressionInner::DeflateRawDecoder(DeflateDecoder::new(w))
            } else {
                CompressionInner::DeflateRawEncoder(DeflateEncoder::new(w, Compression::default()))
            }
        }
    };

    let id = Uuid::new_v4().to_string();

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    let table = &mut state.compression_table;

    table.insert(id.clone(), inner);

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

fn compression_write(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Vec<u8>> {
    let id = args.get(0).to_rust_string_lossy(scope);
    let input = extract_v8_uint8array(args.get(1))?;

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    let table = &mut state.compression_table;

    let inner = table.get_mut(&id).unwrap();

    let out: Vec<u8> = match inner {
        CompressionInner::DeflateDecoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
        }
        CompressionInner::DeflateEncoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
        }
        CompressionInner::DeflateRawDecoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
        }
        CompressionInner::DeflateRawEncoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
        }
        CompressionInner::GzDecoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
        }
        CompressionInner::GzEncoder(d) => {
            d.write_all(&input)?;
            d.flush()?;
            d.get_mut().drain(..)
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

fn compression_finish(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
) -> Result<Vec<u8>> {
    let id = args.get(0).to_rust_string_lossy(scope);

    let isolate_state = Isolate::state(scope);
    let mut state = isolate_state.borrow_mut();

    let table = &mut state.compression_table;

    let inner = table.remove(&id).unwrap();
    let out: Vec<u8> = match inner {
        CompressionInner::DeflateDecoder(d) => d.finish()?,
        CompressionInner::DeflateEncoder(d) => d.finish()?,
        CompressionInner::DeflateRawDecoder(d) => d.finish()?,
        CompressionInner::DeflateRawEncoder(d) => d.finish()?,
        CompressionInner::GzDecoder(d) => d.finish()?,
        CompressionInner::GzEncoder(d) => d.finish()?,
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
