export class RequestResponseBody {
  readonly body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean;

  // isStream is not part of the spec, but required to only stream
  // responses when the body is a stream.
  readonly isStream: boolean;

  private headersInit?: HeadersInit;
  private headersCache: Headers | undefined;

  constructor(
    body: string | ArrayBuffer | ArrayBufferView | FormData | ReadableStream | Blob | null = null,
    headersInit?: HeadersInit,
  ) {
    if (body !== null) {
      if (body instanceof ReadableStream || typeof body === 'string') {
        // @ts-expect-error the type doesn't allow body to be a string, but we
        // bypass this to avoid allocating huge stream objects for small strings
        this.body = body;
        this.bodyUsed = false;
        this.headersInit = headersInit;
        this.isStream = body instanceof ReadableStream;
        return;
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      if (typeof body === 'string') {
        writer.write(globalThis.__lagon__.TEXT_ENCODER.encode(body));
      } else {
        writer.write(body);
      }

      writer.close();

      this.body = stream.readable;
    } else {
      this.body = null;
    }

    this.bodyUsed = false;
    this.headersInit = headersInit;
    this.isStream = false;
  }

  get headers(): Headers {
    if (this.headersCache) {
      return this.headersCache;
    }

    if (this.headersInit) {
      if (this.headersInit instanceof Headers) {
        this.headersCache = this.headersInit;
      } else {
        this.headersCache = new Headers(this.headersInit);
      }
    } else {
      this.headersCache = new Headers();
    }

    return this.headers;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.text().then(text => globalThis.__lagon__.TEXT_ENCODER.encode(text));
  }

  async blob(): Promise<Blob> {
    return this.arrayBuffer().then(buffer => new Blob([buffer]));
  }

  async formData(): Promise<FormData> {
    const body = await this.text();

    return globalThis.__lagon__.parseMultipart(this.headers, body);
  }

  async json<T>(): Promise<T> {
    return this.text().then(text => JSON.parse(text));
  }

  async text(): Promise<string> {
    if (this.bodyUsed) {
      throw new TypeError('Body is already used');
    }

    if (!this.body) {
      this.bodyUsed = true;
      return '';
    }

    if (typeof this.body === 'string') {
      this.bodyUsed = true;
      return this.body;
    }

    return new Promise(resolve => {
      const reader = (this.body as ReadableStream<Uint8Array>).getReader();
      let result = '';

      const pull = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            this.bodyUsed = true;
            return resolve(result);
          }

          if (globalThis.__lagon__.isIterable(value)) {
            result += globalThis.__lagon__.TEXT_DECODER.decode(value);
          } else {
            result += value;
          }

          pull();
        });
      };

      pull();
    });
  }
}
