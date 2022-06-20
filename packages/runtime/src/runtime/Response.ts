import { parseMultipart } from './parseMultipart';

export interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
}

export class Response {
  body: string;
  headers: Record<string, string | string[] | undefined>;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;

  constructor(body: string, options?: ResponseInit) {
    this.body = body;
    this.headers = options?.headers || {};

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
