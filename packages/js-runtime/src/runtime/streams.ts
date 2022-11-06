import {
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  TransformStream,
  WritableStream,
  WritableStreamDefaultWriter,
} from 'web-streams-polyfill';

(globalThis => {
  globalThis.ReadableStream = ReadableStream;
  // @ts-expect-error type slightly differs
  globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
  // @ts-expect-error type slightly differs
  globalThis.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
  globalThis.TransformStream = TransformStream;
  globalThis.WritableStream = WritableStream;
  // @ts-expect-error type slightly differs
  globalThis.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
})(globalThis);
