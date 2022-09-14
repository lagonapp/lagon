export class URLSearchParams {
  private params: Map<string, string[]> = new Map();

  constructor(init?: string | Record<string, string> | string[][]) {
    if (init) {
      if (typeof init === 'string') {
        init
          .replace('?', '')
          .split('&')
          .forEach(entry => {
            const [key, value] = entry.split('=');

            this.addValue(key, value);
          });
      } else if (typeof init === 'object') {
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
  }

  private addValue(name: string, value: string) {
    const values = this.params.get(name);

    if (values) {
      values.push(value);
    } else {
      this.params.set(name, [value]);
    }
  }

  append(name: string, value: string) {
    this.addValue(name, value);
  }

  delete(name: string) {
    this.params.delete(name);
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, values] of this.params) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) {
    this.params.forEach((values, key) => {
      values.forEach(value => {
        callback.call(thisArg, value, key, this);
      });
    });
  }

  get(name: string): string | undefined {
    return this.params.get(name)?.[0];
  }

  getAll(name: string): string[] | undefined {
    return this.params.get(name);
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  keys(): IterableIterator<string> {
    return this.params.keys();
  }

  set(name: string, value: string) {
    this.params.set(name, [value]);
  }

  sort() {
    this.params = new Map([...this.params].sort());
  }

  toString(): string {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  *values(): IterableIterator<string> {
    for (const [, values] of this.params) {
      for (const value of values) {
        yield value;
      }
    }
  }
}

export class URL {
  public hash = '';
  public host = '';
  public hostname = '';
  public href = '';
  public origin = '';
  public password = '';
  public pathname = '';
  public port = '';
  public protocol = '';
  public search = '';
  public searchParams: URLSearchParams | null = null;
  public username = '';

  constructor(url: string, base?: string) {
    let finalUrl = url;

    if (base) {
      const baseUrl = new URL(base);
      finalUrl = baseUrl.protocol + '//' + baseUrl.host; // + '/' + url;

      if (!url.startsWith('/')) {
        finalUrl += '/';
      }

      finalUrl += url;
    }

    const result =
      // eslint-disable-next-line
      /((?:blob|file):)?(https?\:)\/\/(?:(.*):(.*)@)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(
        finalUrl,
      );

    if (result) {
      const [href, origin, protocol, username, password, host, hostname, port, pathname, search, hash] = result;

      this.hash = hash;
      this.host = host;
      this.hostname = hostname;
      this.href = href;

      if (['http:', 'https:'].includes(protocol) || ['blob:', 'file:'].includes(origin)) {
        this.origin = protocol + '//' + hostname;
      }

      this.password = password;
      this.pathname = pathname === '' ? '/' : pathname;
      this.port = port;
      this.protocol = protocol;
      this.search = search;
      this.searchParams = new URLSearchParams(search);
      this.username = username;
    }
  }

  toString(): string {
    return this.href;
  }
}
