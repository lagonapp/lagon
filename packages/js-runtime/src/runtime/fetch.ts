import { RequestInit } from './Request';
import { Response } from './Response';

export class Headers {
  private headers: Map<string, string[]> = new Map();

  constructor(init?: Record<string, string> | string[][]) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.addValue(key, value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.addValue(key, value);
        });
      }
    }
  }

  private addValue(name: string, value: string) {
    const values = this.headers.get(name);

    if (values) {
      values.push(value);
    } else {
      this.headers.set(name, [value]);
    }
  }

  append(name: string, value: string) {
    this.addValue(name, value);
  }

  delete(name: string) {
    this.headers.delete(name);
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, values] of this.headers) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  get(name: string): string | undefined {
    return this.headers.get(name)?.[0];
  }

  has(name: string): boolean {
    return this.headers.has(name);
  }

  keys(): IterableIterator<string> {
    return this.headers.keys();
  }

  set(name: string, value: string) {
    this.headers.set(name, [value]);
  }

  *values(): IterableIterator<string> {
    for (const [, values] of this.headers) {
      for (const value of values) {
        yield value;
      }
    }
  }
}

const isHeadersObject = (headers: Record<string, string> | Headers | undefined): headers is Headers =>
  !!headers && 'entries' in headers;

export async function fetch(resource: string, options?: RequestInit) {
  let headers: Map<string, string> | undefined = undefined;

  if (isHeadersObject(options?.headers)) {
    headers = new Map();

    for (const [key, value] of (options?.headers as Headers).entries()) {
      headers.set(key, value);
    }
  } else if (options?.headers) {
    headers = new Map(Object.entries(options.headers));
  }

  const response = await Lagon.fetch({
    method: options?.method || 'GET',
    url: resource,
    body: options?.body,
    headers,
  });

  return new Response(response.body, {
    // url: response.options.url,
    headers: response.headers,
    status: response.status,
  });
}
