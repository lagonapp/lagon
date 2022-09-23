import { Headers } from './fetch';
import { parseMultipart } from './parseMultipart';

export interface RequestInit {
  method?: string;
  headers?: Headers | Record<string, string>;
  body?: string;
}

export class Request {
  method: string;
  headers: Headers;
  body?: string;
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

    this.body = options?.body;
    this.url = input;
  }

  async text(): Promise<string> {
    return this.body || '';
  }

  async json<T>(): Promise<T> {
    return JSON.parse(this.body || '{}');
  }

  async formData(): Promise<Record<string, string>> {
    return parseMultipart(this.headers, this.body);
  }
}
