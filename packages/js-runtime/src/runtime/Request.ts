import { Body } from './body';

(globalThis => {
  globalThis.Request = class extends Body {
    method: string;
    headers: Headers;
    url: string;
    // TODO
    cache: any;
    credentials: any;
    destination: any;
    integrity: any;
    keepalive: any;
    mode: any;
    redirect: any;
    referrer: any;
    referrerPolicy: any;
    signal: any;
    clone: any;
    bodyUsed: any;
    blob: any;

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(init?.body);

      this.method = init?.method || 'GET';

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          this.headers = init.headers;
        } else {
          this.headers = new Headers(init.headers);
        }
      } else {
        this.headers = new Headers();
      }

      this.url = input.toString();
    }
  };
})(globalThis);
