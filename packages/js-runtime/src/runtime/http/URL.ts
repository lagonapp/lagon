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
