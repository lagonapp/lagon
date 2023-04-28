export class RequestResponseBody {
  private theBody: ReadableStream<Uint8Array> | string | ArrayBuffer | null;
  bodyUsed: boolean;

  // isStream is not part of the spec, but required to only stream
  // responses when the body is a stream.
  readonly isStream: boolean;

  private headersInit?: HeadersInit;
  private headersCache: Headers | undefined;

  constructor(
    body: string | ArrayBuffer | ArrayBufferView | FormData | ReadableStream | Blob | URLSearchParams | null = null,
    headersInit?: HeadersInit,
  ) {
    if (body !== null) {
      const isPrimitive = typeof body === 'number' || typeof body === 'boolean';

      if (
        body instanceof ReadableStream ||
        globalThis.__lagon__.isIterable(body) ||
        typeof body === 'string' ||
        isPrimitive
      ) {
        this.theBody = isPrimitive ? String(body) : body;
        this.bodyUsed = false;
        this.headersInit = headersInit;
        this.isStream = body instanceof ReadableStream;
        return;
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      writer.write(body);
      writer.close();

      this.theBody = stream.readable;
    } else {
      this.theBody = null;
    }

    this.bodyUsed = false;
    this.headersInit = headersInit;
    this.isStream = false;

    if (body instanceof URLSearchParams) {
      this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
  }

  get body(): ReadableStream<Uint8Array> {
    if (this.theBody instanceof ReadableStream) {
      return this.theBody;
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    if (globalThis.__lagon__.isIterable(this.theBody)) {
      writer.write(this.theBody);
    } else {
      const body =
        typeof this.theBody === 'number' || typeof this.theBody === 'boolean'
          ? String(this.theBody)
          : this.theBody ?? '';

      writer.write(globalThis.__lagon__.TEXT_ENCODER.encode(body));
    }

    writer.close();

    return stream.readable;
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

    return this.headersCache;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.bodyUsed) {
      throw new TypeError('Body is already used');
    }

    if (!this.theBody) {
      this.bodyUsed = true;
      return new Uint8Array();
    }

    if (typeof this.theBody === 'string') {
      this.bodyUsed = true;
      return globalThis.__lagon__.TEXT_ENCODER.encode(this.theBody);
    }

    if (globalThis.__lagon__.isIterable(this.theBody)) {
      this.bodyUsed = true;
      return this.theBody;
    }

    const reader = this.theBody.getReader();

    return new Promise(resolve => {
      let result = new Uint8Array();

      const pull = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            this.bodyUsed = true;
            return resolve(result);
          }

          const newResult = new Uint8Array(result.length + value.length);
          newResult.set(result);
          newResult.set(value, result.length);

          result = newResult;

          pull();
        });
      };

      pull();
    });
  }

  async blob(): Promise<Blob> {
    const type = this.headers.get('content-type') || undefined;

    return this.arrayBuffer().then(buffer => new Blob([buffer], { type }));
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

    if (!this.theBody) {
      this.bodyUsed = true;
      return '';
    }

    if (typeof this.theBody === 'string') {
      this.bodyUsed = true;
      return this.theBody;
    }

    if (globalThis.__lagon__.isIterable(this.theBody)) {
      this.bodyUsed = true;
      return globalThis.__lagon__.TEXT_DECODER.decode(this.theBody);
    }

    const reader = this.theBody.getReader();

    return new Promise(resolve => {
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
