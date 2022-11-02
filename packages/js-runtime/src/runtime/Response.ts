import { Headers } from './fetch';

export interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Headers | Record<string, string>;
  url?: string;
}

export class Response {
  body: string | ArrayBuffer | null;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;

  constructor(body: string | ArrayBuffer | null = null, options?: ResponseInit) {
    this.body = body;

    if (options?.headers) {
      if (options.headers instanceof Headers) {
        this.headers = options.headers;
      } else {
        this.headers = new Headers(options.headers);
      }
    } else {
      this.headers = new Headers();
    }

    if (options?.status) {
      this.ok = options.status >= 200 && options.status < 300;
    } else {
      this.ok = true;
    }

    this.status = options?.status || 200;
    this.statusText = options?.statusText || 'OK';
    this.url = options?.url || '';
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

    return this.body ? globalThis.__lagon__.TEXT_ENCODER.encode(this.body) : new ArrayBuffer(0);
  }
}
