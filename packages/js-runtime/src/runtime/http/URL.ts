(globalThis => {
  // From https://url.spec.whatwg.org/#url-miscellaneous
  const DEFAULT_PORTS: Record<string, string> = {
    'ftp:': '21',
    'http:': '80',
    'https:': '443',
    'ws:': '80',
    'wss:': '443',
  };

  globalThis.URL = class {
    public hash = '';
    public hostname = '';
    public origin = '';
    public password = '';
    public pathname = '';
    public port = '';
    public protocol = '';
    public searchParams!: URLSearchParams;
    public username = '';

    constructor(url: string | URL, base?: string | URL) {
      this.initialize(url, base);
    }

    private initialize(url: string | URL, base?: string | URL) {
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
        /((?:blob|file):)?(https?\:)\/\/(?:(.*):(.*)@)?([^:\/?#]*)(?:\:([0-9]+))?([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(
          finalUrl,
        );

      if (result) {
        const [_href, origin, protocol, username, password, hostname, port, pathname, search, hash] = result;

        void _href;

        this.hash = hash;
        this.hostname = hostname;

        this.port = port === DEFAULT_PORTS[protocol] ? '' : port;

        if (['http:', 'https:'].includes(protocol) || ['blob:', 'file:'].includes(origin)) {
          this.origin = protocol + '//' + hostname;
          if (this.port) {
            this.origin += ':' + this.port;
          }
        }

        this.password = password || '';
        this.pathname = pathname === '' ? '/' : pathname;
        this.protocol = protocol;
        this.searchParams = new URLSearchParams(search);
        this.username = username || '';
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

    get href(): string {
      const credentials = this.username + (this.password ? ':' + this.password : '');

      let href =
        this.protocol +
        '//' +
        (credentials ? credentials + '@' : '') +
        this.host +
        this.pathname +
        this.search +
        this.hash;

      if (this.protocol === 'file:') {
        href = href.replace('//', '');
      }

      return href;
    }

    set href(href: string) {
      this.initialize(href);
    }

    get host(): string {
      return this.hostname + (this.port ? ':' + this.port : '');
    }

    set host(host: string) {
      // eslint-disable-next-line no-useless-escape
      const result = /^([^:\/?#]*)(?:\:([0-9]+))$/.exec(host);
      if (result) {
        const [, hostname, port] = result;
        this.hostname = hostname;
        this.port = port;
      } else {
        this.hostname = host;
        this.port = '';
      }
    }

    get search(): string {
      const search = this.searchParams.toString();
      return search ? '?' + search : '';
    }

    set search(search: string) {
      const newSearchParams = new URLSearchParams(search);
      for (const key of this.searchParams.keys()) {
        this.searchParams.delete(key);
      }

      for (const [key, value] of newSearchParams) {
        this.searchParams.append(key, value);
      }
    }

    toString(): string {
      return this.href;
    }

    toJSON(): string {
      return this.toString();
    }
  };
})(globalThis);
