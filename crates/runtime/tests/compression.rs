use hyper::{header::CONTENT_TYPE, Body, Request, Response};
use lagon_runtime_http::RunResult;
use lagon_runtime_isolate::options::IsolateOptions;

mod utils;

const COMMON: &str = "function compress(string, encoding) {
    const byteArray = new TextEncoder().encode(string);
    const compressionStream = new CompressionStream(encoding);

    const writer = compressionStream.writable.getWriter();
    writer.write(byteArray);
    writer.close();

    return new Response(compressionStream.readable).arrayBuffer();
}

function decompress(byteArray, encoding) {
    const decompressionStream = new DecompressionStream(encoding);
    const writer = decompressionStream.writable.getWriter();

    writer.write(byteArray);
    writer.close();

    return new Response(decompressionStream.readable).arrayBuffer().then((arrayBuffer) => {
        return new TextDecoder().decode(arrayBuffer);
    });
}

const test = `http://www.ScriptCompress.com - Simple Packer/Minify/Compress JavaScript Minify, Fixify & Prettify 75 JS Obfuscators In 1 App 25 JS Compressors (Gzip, Bzip, LZMA, etc) PHP, HTML & JS Packers In 1 App PHP Source Code Packers Text Packer HTML Packer or v2 or v3 or LZW Twitter Compress or More Words DNA & Base64 Packer (freq tool) or v2 JS JavaScript Code Golfer Encode Between Quotes Decode Almost Anything Password Protect Scripts HTML Minifier v2 or Encoder or Escaper CSS Minifier or Compressor v2 SVG Image Shrinker HTML To: SVG or SVGZ (Gzipped) HTML To: PNG or v2 2015 JS Packer v2 v3 Embedded File Generator Extreme Packer or version 2 Our Blog DemoScene JS Packer Basic JS Packer or New Version Asciify JavaScript Escape JavaScript Characters UnPacker Packed JS JavaScript Minify/Uglify Text Splitter/Chunker Twitter, Use More Characters Base64 Drag 'n Drop Redirect URL DataURI Get Words Repeated LZMA Archiver ZIP Read/Extract/Make BEAUTIFIER & CODE FIXER WHAK-A-SCRIPT JAVASCRIPT MANGLER 30 STRING ENCODERS CONVERTERS, ENCRYPTION & ENCODERS 43 Byte 1px GIF Generator Steganography PNG Generator WEB APPS VIA DATAURL OLD VERSION OF WHAK PAKr Fun Text Encrypt Our Google`;

async function testCompression(text, encoding) {
    const compressedData = await compress(text, encoding);
    const decompressedText = await decompress(compressedData, encoding);

    return {
      compressedLength: compressedData.byteLength,
      decompressedLength: decompressedText.length,
      result: text === decompressedText,
    };
}";

#[tokio::test]
async fn compress_decompress_deflate() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "{COMMON}

export async function handler() {{
    const {{ compressedLength, decompressedLength, result }} = await testCompression(test, 'deflate');

    return new Response(`${{compressedLength}} ${{decompressedLength}} ${{result}}`);
}}",
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("659 1179 true"),
    )
    .await;
}

#[tokio::test]
async fn compress_decompress_deflate_raw() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "{COMMON}

export async function handler() {{
    const {{ compressedLength, decompressedLength, result }} = await testCompression(test, 'deflate-raw');

    return new Response(`${{compressedLength}} ${{decompressedLength}} ${{result}}`);
}}",
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("653 1179 true"),
    )
    .await;
}

#[tokio::test]
async fn compress_decompress_gzip() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "{COMMON}

export async function handler() {{
    const {{ compressedLength, decompressedLength, result }} = await testCompression(test, 'gzip');

    return new Response(`${{compressedLength}} ${{decompressedLength}} ${{result}}`);
}}",
    )));
    send(Request::default());

    utils::assert_response(
        &receiver,
        Response::builder().header(CONTENT_TYPE, "text/plain;charset=UTF-8"),
        Body::from("671 1179 true"),
    )
    .await;
}

#[tokio::test]
async fn compress_decompress_unknown_format() {
    utils::setup();
    let (send, receiver) = utils::create_isolate(IsolateOptions::new(format!(
        "{COMMON}

export async function handler() {{
    const {{ compressedLength, decompressedLength, result }} = await testCompression(test, 'unknown');

    return new Response(`${{compressedLength}} ${{decompressedLength}} ${{result}}`);
}}",
    )));
    send(Request::default());

    utils::assert_run_result(
        &receiver,
        RunResult::Error(
            "Uncaught TypeError: Compression format not supported\n  at compress (3:31)\n  at testCompression (27:34)\n  at handler (38:68)".into(),
        ),
    )
    .await;
}
