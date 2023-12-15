(globalThis => {
  globalThis.CompressionStream = class {
    private readonly transform;

    constructor(format: CompressionFormat) {
      const id = LagonSync.compressionCreate(format, false);

      this.transform = new TransformStream({
        transform(chunk, controller) {
          const output = LagonSync.compressionWrite(id, chunk);

          controller.enqueue(output);
        },
        flush(controller) {
          const output = LagonSync.compressionFinish(id);

          controller.enqueue(output);
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
    private readonly transform;

    constructor(format: CompressionFormat) {
      const id = LagonSync.compressionCreate(format, true);

      this.transform = new TransformStream({
        transform(chunk, controller) {
          const output = LagonSync.compressionWrite(id, chunk);

          controller.enqueue(output);
        },
        flush(controller) {
          const output = LagonSync.compressionFinish(id);

          controller.enqueue(output);
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
