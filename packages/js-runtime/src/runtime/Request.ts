import { Headers } from './fetch';

export interface RequestInit {
  method?: string;
  headers?: Headers | Record<string, string>;
  body?: string | ArrayBuffer;
}

export class Request {
  method: string;
  headers: Headers;
  body: string | ArrayBuffer;
  url: string;

  constructor(input: string, options?: RequestInit) {
    this.method = options?.method || 'GET';

    if (options?.headers) {
      if (options.headers instanceof Headers) {
        this.headers = options.headers;
      } else {
        this.headers = new Headers(options.headers);
      }
    } else {
      this.headers = new Headers();
    }

    this.body = options?.body || '';
    this.url = input;
  }

  async text(): Promise<string> {
    if (globalThis.__lagon__.isIterable(this.body)) {
      return globalThis.__lagon__.TEXT_DECODER.decode(this.body);
    }

    return this.body || '';
  }

  async json<T>(): Promise<T> {
    const body = await this.text();

    return JSON.parse(body);
  }

  async formData(): Promise<Record<string, string>> {
    const body = await this.text();

    return globalThis.__lagon__.parseMultipart(this.headers, body);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (globalThis.__lagon__.isIterable(this.body)) {
      return this.body;
    }

    return globalThis.__lagon__.TEXT_ENCODER.encode(this.body);
  }
}
