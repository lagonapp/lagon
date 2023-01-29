(globalThis => {
  const {
    ReadableStream,
    ReadableStreamBYOBReader,
    ReadableStreamDefaultReader,
    TransformStream,
    WritableStream,
    WritableStreamDefaultWriter,
  } = require('web-streams-polyfill');

  globalThis.ReadableStream = ReadableStream;
  globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
  globalThis.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
  globalThis.TransformStream = TransformStream;
  globalThis.WritableStream = WritableStream;
  globalThis.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
})(globalThis);
