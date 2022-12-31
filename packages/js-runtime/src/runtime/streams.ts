import {
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  TransformStream,
  WritableStream,
  WritableStreamDefaultWriter,
} from 'web-streams-polyfill';

(globalThis => {
  // @ts-expect-error type slightly differs
  globalThis.ReadableStream = ReadableStream;
  // @ts-expect-error type slightly differs
  globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
  // @ts-expect-error type slightly differs
  globalThis.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
  globalThis.TransformStream = TransformStream;
  // @ts-expect-error type slightly differs
  globalThis.WritableStream = WritableStream;
  // @ts-expect-error type slightly differs
  globalThis.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
})(globalThis);
