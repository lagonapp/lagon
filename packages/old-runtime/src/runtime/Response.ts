import { Headers } from './fetch';
import { parseMultipart } from './parseMultipart';

export interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Headers | Record<string, string>;
  url?: string;
}

export class Response {
  body: string | Uint8Array;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;

  constructor(body: string | Uint8Array, options?: ResponseInit) {
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
    if (this.body instanceof Uint8Array) {
      throw new Error('Cannot read text from Uint8Array');
    }

    return this.body;
  }

  async json<T>(): Promise<T> {
    if (this.body instanceof Uint8Array) {
      throw new Error('Cannot read text from Uint8Array');
    }

    return JSON.parse(this.body);
  }

  async formData(): Promise<Record<string, string>> {
    if (this.body instanceof Uint8Array) {
      throw new Error('Cannot read text from Uint8Array');
    }

    return parseMultipart(this.headers, this.body);
  }
}
