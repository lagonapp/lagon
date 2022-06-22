export class URLSearchParams {
  private params: Map<string, string> = new Map();

  constructor(init?: string) {
    if (init) {
      init
        .replace('?', '')
        .split('&')
        .forEach(entry => {
          const [key, value] = entry.split('=');

          this.params.set(key, value);
        });
    }
  }

  append(name: string, value: string) {
    this.params.set(name, value);
  }

  delete(name: string) {
    this.params.delete(name);
  }

  entries(): IterableIterator<[string, string]> {
    return this.params.entries();
  }

  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) {
    this.params.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }

  get(name: string): string | undefined {
    return this.params.get(name);
  }

  getAll(name: string): string[] | undefined {
    // TODO
    return [];
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  keys(): IterableIterator<string> {
    return this.params.keys();
  }

  set(name: string, value: string) {
    this.params.set(name, value);
  }

  sort() {
    // TODO
  }

  toString(): string {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  values(): IterableIterator<string> {
    return this.params.values();
  }
}

export class URL {
  public hash = '';
  public host = '';
  public hostname = '';
  public href = '';
  public origin = '';
  // public password = '';
  public pathname = '';
  public port = '';
  public protocol = '';
  public search = '';
  public searchParams: URLSearchParams | null = null;
  // public username = '';

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

    // eslint-disable-next-line
    const result = /((?:blob|file):)?(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(finalUrl);

    if (result) {
      const [href, origin, protocol, host, hostname, port, pathname, search, hash] = result;

      this.hash = hash;
      this.host = host;
      this.hostname = hostname;
      this.href = href;

      if (['http:', 'https:'].includes(protocol) || ['blob:', 'file:'].includes(origin)) {
        this.origin = protocol + '//' + hostname;
      }

      this.pathname = pathname;
      this.port = port;
      this.protocol = protocol;
      this.search = search;
      this.searchParams = new URLSearchParams(search);
    }
  }

  toString(): string {
    return this.href;
  }
}
