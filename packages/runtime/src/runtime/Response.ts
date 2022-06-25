import { Headers } from './fetch';
import { parseMultipart } from './parseMultipart';

export interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Headers | Record<string, string>;
  url?: string;
}

export class Response {
  body: string;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;

  constructor(body: string, options?: ResponseInit) {
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
    return this.body;
  }

  async json<T>(): Promise<T> {
    return JSON.parse(this.body);
  }

  async formData(): Promise<Record<string, string>> {
    return parseMultipart(this.headers, this.body);
  }
}
