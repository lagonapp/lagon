// // @ts-expect-error blob-polyfill isn't typed
// import { Blob } from 'blob-polyfill';

(globalThis => {
  globalThis.Blob = class {
    readonly size: number;
    readonly type: string;
    readonly buffer: Uint8Array;

    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
      if (blobParts) {
        const chunks = blobParts.map(blobPart => {
          if (typeof blobPart === 'string') {
            return globalThis.__lagon__.TEXT_ENCODER.encode(blobPart);
          } else if (blobPart instanceof ArrayBuffer) {
            return new Uint8Array(blobPart);
          } else if (blobPart instanceof Blob) {
            return blobPart.buffer as Uint8Array;
          } else {
            return new Uint8Array(0);
          }
        });

        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const buffer = new Uint8Array(totalSize);
        let offset = 0;

        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.byteLength;
        }

        this.size = buffer.byteLength;
        this.buffer = buffer;
      } else {
        this.size = 0;
      }

      this.type = options?.type || '';
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(this.buffer.buffer);
    }

    slice(start?: number, end?: number, contentType?: string): Blob {}

    stream(): ReadableStream<Uint8Array> {
      return new ReadableStream({
        pull: async controller => {
          controller.enqueue(this.buffer);
          controller.close();
        },
      });
    }

    text(): Promise<string> {
      return Promise.resolve(globalThis.__lagon__.TEXT_DECODER.decode(this.buffer));
    }
  };
})(globalThis);
