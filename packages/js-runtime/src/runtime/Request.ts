import { Body } from './body';

(globalThis => {
  globalThis.Request = class extends Body {
    method: string;
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
      let headers: Headers;

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          headers = init.headers;
        } else {
          headers = new Headers(init.headers);
        }
      } else {
        headers = new Headers();
      }

      super(init?.body, headers);

      this.method = init?.method || 'GET';
      this.url = input.toString();
    }
  };
})(globalThis);
