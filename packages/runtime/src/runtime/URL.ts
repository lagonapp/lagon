export class URL {
  public hash = '';
  public host = '';
  public hostname = '';
  public href = '';
  // public origin = '';
  // public password = '';
  // public pathname = '';
  public port = '';
  public protocol = '';
  // public search = '';
  // public searchParams: any;
  // public username = '';

  constructor(url: string, base?: string) {
    this.hash = url.split('#').length === 2 ? '#' + url.split('#')[1] : '';
    this.host = url.split('://')[1]?.split('/')?.[0] || '';
    this.hostname = url.split('://')[1]?.split('/')?.[0]?.split(':')?.[0] || '';
    this.href = url;
    this.port = url.split('://')[1]?.split(':')[1]?.split('/')?.[0] || '';
    this.protocol = url.split('://').length === 2 ? url.split('://')[0] + ':' : '';

    const schemes = {
      http: '80',
      https: '443',
      ftp: '21',
      ssh: '22',
    };

    // @ts-expect-error protocol.replace should returns the keys of `schemes` | undefined
    const port = schemes[this.protocol.replace(':', '')];

    if (port === this.port) {
      this.host = this.host.replace(':' + port, '');
    }
  }
}
