export class RequestResponseBody {
  readonly body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean;
  headers: Headers;
  // isStream is not part of the spec, but required to only stream
  // responses when the body is a stream.
  isStream: boolean;

  constructor(
    body: string | ArrayBuffer | ArrayBufferView | FormData | ReadableStream | Blob | null = null,
    headers: Headers,
  ) {
    if (body !== null) {
      if (body instanceof ReadableStream) {
        this.body = body;
        this.bodyUsed = false;
        this.headers = headers;
        this.isStream = true;
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
    this.headers = headers;
    this.isStream = false;
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
    return new Promise((resolve, reject) => {
      if (this.bodyUsed) {
        return reject(new TypeError('Body is already used'));
      }

      if (!this.body) {
        return resolve('');
      }

      const reader = this.body.getReader();
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
