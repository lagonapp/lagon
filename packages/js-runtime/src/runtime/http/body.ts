export class RequestResponseBody {
  private theBody: string | ArrayBuffer | FormData | ReadableStream<Uint8Array> | Blob | URLSearchParams | null;
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
    const isPrimitive = typeof body === 'number' || typeof body === 'boolean';
    // @ts-expect-error we ignore ArrayBufferView
    this.theBody = isPrimitive ? String(body) : body;
    this.headersInit = headersInit;
    this.bodyUsed = false;
    this.isStream = body instanceof ReadableStream;

    if (typeof body === 'string' || isPrimitive) {
      this.headers.set('content-type', this.headers.get('content-type') ?? 'text/plain;charset=UTF-8');
    }

    if (body instanceof FormData) {
      this.headers.set('content-type', this.headers.get('content-type') ?? 'multipart/form-data');
    }

    if (body instanceof URLSearchParams) {
      this.headers.set(
        'content-type',
        this.headers.get('content-type') ?? 'application/x-www-form-urlencoded;charset=UTF-8',
      );
    }

    if (body instanceof Blob) {
      this.headers.set('content-type', this.headers.get('content-type') ?? body.type);
    }
  }

  get body(): ReadableStream<Uint8Array> | null {
    if (!this.theBody) {
      return null;
    }

    if (this.theBody instanceof ReadableStream) {
      return this.theBody;
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    if (this.theBody instanceof ArrayBuffer || this.theBody instanceof Uint8Array) {
      writer.write(this.theBody);
    } else if (this.theBody instanceof FormData || this.theBody instanceof URLSearchParams) {
      writer.write(globalThis.__lagon__.TEXT_ENCODER.encode(this.theBody.toString()));
    } else if (this.theBody instanceof Blob) {
      writer.write(this.theBody.buffer);
    } else {
      writer.write(globalThis.__lagon__.TEXT_ENCODER.encode(this.theBody ?? ''));
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

    if (this.theBody === null) {
      return new Uint8Array();
    }

    if (typeof this.theBody === 'string') {
      this.bodyUsed = true;
      return globalThis.__lagon__.TEXT_ENCODER.encode(this.theBody);
    }

    if (this.theBody instanceof ArrayBuffer || this.theBody instanceof Uint8Array) {
      this.bodyUsed = true;
      return this.theBody;
    }

    if (this.theBody instanceof FormData || this.theBody instanceof URLSearchParams) {
      this.bodyUsed = true;
      return globalThis.__lagon__.TEXT_ENCODER.encode(this.theBody.toString());
    }

    if (this.theBody instanceof Blob) {
      this.bodyUsed = true;
      return this.theBody.arrayBuffer();
    }

    const reader = (this.theBody as ReadableStream<Uint8Array>).getReader();

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
    if (this.bodyUsed) {
      throw new TypeError('Body is already used');
    }

    if (this.theBody instanceof FormData) {
      this.bodyUsed = true;
      return this.theBody;
    }

    const body = await this.text();

    return globalThis.__lagon__.parseMultipart(this.headers, body);
  }

  async json<T>(): Promise<T> {
    return this.text().then(JSON.parse);
  }

  async text(): Promise<string> {
    if (this.bodyUsed) {
      throw new TypeError('Body is already used');
    }

    if (this.theBody === null) {
      return '';
    }

    if (typeof this.theBody === 'string') {
      this.bodyUsed = true;
      return this.theBody;
    }

    if (this.theBody instanceof ArrayBuffer || this.theBody instanceof Uint8Array) {
      this.bodyUsed = true;
      return globalThis.__lagon__.TEXT_DECODER.decode(this.theBody);
    }

    const isFormData = this.theBody instanceof FormData;

    if (isFormData || this.theBody instanceof URLSearchParams) {
      this.bodyUsed = true;

      if (isFormData) {
        return Array.from((this.theBody as FormData).entries())
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
      }

      return this.theBody.toString();
    }

    if (this.theBody instanceof Blob) {
      this.bodyUsed = true;
      return this.theBody.text();
    }

    const reader = (this.theBody as ReadableStream<Uint8Array>).getReader();

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
