(globalThis => {
  const compressionFormats = ['deflate', 'deflate-raw', 'gzip'] as const;

  globalThis.CompressionStream = class {
    private transform;

    constructor(format: 'deflate' | 'deflate-raw' | 'gzip') {
      if (!compressionFormats.includes(format)) {
        throw new DOMException(
          `Only 'deflate', 'deflate-raw' or 'gzip' are allowed in a CompressionStream format.`,
          'SyntaxError',
        );
      }

      const id = LagonSync.compressionCreate(format, false);

      this.transform = new TransformStream({
        transform(chunk, controller) {
          const output = LagonSync.compressionWrite(id, chunk);
          if (output.length > 0) {
            controller.enqueue(output);
          }
        },
        flush(controller) {
          const output = LagonSync.compressionFinish(id);
          if (output.length > 0) {
            controller.enqueue(output);
          }
        },
      });
    }

    get readable() {
      return this.transform.readable;
    }

    get writable() {
      return this.transform.writable;
    }
  };

  globalThis.DecompressionStream = class {
    private transform;

    constructor(format: 'deflate' | 'deflate-raw' | 'gzip') {
      if (!compressionFormats.includes(format)) {
        throw new DOMException(
          `Only 'deflate', 'deflate-raw' or 'gzip' are allowed in a CompressionStream format.`,
          'SyntaxError',
        );
      }

      const id = LagonSync.compressionCreate(format, true);

      this.transform = new TransformStream({
        transform(chunk, controller) {
          const output = LagonSync.compressionWrite(id, chunk);
          if (output.length > 0) {
            controller.enqueue(output);
          }
        },
        flush(controller) {
          const output = LagonSync.compressionFinish(id);
          if (output.length > 0) {
            controller.enqueue(output);
          }
        },
      });
    }

    get readable() {
      return this.transform.readable;
    }

    get writable() {
      return this.transform.writable;
    }
  };
})(globalThis);