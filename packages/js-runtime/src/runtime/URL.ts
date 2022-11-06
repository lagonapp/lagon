(globalThis => {
  // From https://url.spec.whatwg.org/#url-miscellaneous
  const DEFAULT_PORTS: Record<string, string> = {
    'ftp:': '21',
    'http:': '80',
    'https:': '443',
    'ws:': '80',
    'wss:': '443',
  };

  globalThis.URLSearchParams = class {
    private params: Map<string, string[]> = new Map();

    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
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

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) {
      this.params.forEach((values, key) => {
        values.forEach(value => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }

    get(name: string): string | null {
      return this.params.get(name)?.[0] || null;
    }

    getAll(name: string): string[] {
      return this.params.get(name) || [];
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

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.entries();
    }
  };

  globalThis.URL = class {
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
    public searchParams: URLSearchParams;
    public username = '';

    constructor(url: string | URL, base?: string | URL) {
      let finalUrl = url.toString();

      if (base) {
        const baseUrl = new URL(base);
        finalUrl = baseUrl.protocol + '//' + baseUrl.host; // + '/' + url;

        if (!url.toString().startsWith('/')) {
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

        this.port = port === DEFAULT_PORTS[protocol] ? '' : port;

        if (['http:', 'https:'].includes(protocol) || ['blob:', 'file:'].includes(origin)) {
          this.origin = protocol + '//' + hostname;
          if (this.port) {
            this.origin += ':' + this.port;
          }
        }

        this.password = password;
        this.pathname = pathname === '' ? '/' : pathname;
        this.protocol = protocol;
        this.search = search;
        this.searchParams = new URLSearchParams(search);
        this.username = username;
      } else {
        this.searchParams = new URLSearchParams();
      }
    }

    static createObjectURL(obj: Blob): string {
      // TODO
      throw new Error('Not implemented');
    }

    static revokeObjectURL(url: string) {
      // TODO
      throw new Error('Not implemented');
    }

    toString(): string {
      return this.href;
    }

    toJSON(): string {
      return this.toString();
    }
  };
})(globalThis);
