import { TextDecoder, TextEncoder } from './encoding';
import { Headers } from './fetch';
import { parseMultipart } from './parseMultipart';

export interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Headers | Record<string, string>;
  url?: string;
}

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

const isIterable = (value: unknown): value is ArrayBuffer =>
  typeof value !== 'string' && Symbol.iterator in Object(value);

export class Response {
  body: string | ArrayBuffer;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;

  constructor(body: string | ArrayBuffer, options?: ResponseInit) {
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
    if (isIterable(this.body)) {
      return DECODER.decode(this.body);
    }

    return this.body;
  }

  async json<T>(): Promise<T> {
    return JSON.parse(await this.text());
  }

  async formData(): Promise<Record<string, string>> {
    return parseMultipart(this.headers, await this.text());
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (isIterable(this.body)) {
      return this.body;
    }

    return ENCODER.encode(this.body);
  }
}
