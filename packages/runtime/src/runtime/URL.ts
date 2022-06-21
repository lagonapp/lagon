export class URL {
  public hash = '';
  public host = '';
  public hostname = '';
  public href = '';
  // public origin = '';
  // public password = '';
  public pathname = '';
  public port = '';
  public protocol = '';
  public search = '';
  // public searchParams: any;
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
    const result = /^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(finalUrl);

    if (result) {
      const [href, protocol, host, hostname, port, pathname, search, hash] = result;

      this.hash = hash;
      this.host = host;
      this.hostname = hostname;
      this.href = href;
      this.pathname = pathname;
      this.port = port;
      this.protocol = protocol;
      this.search = search;
    }
  }

  toString(): string {
    return this.href;
  }
}
