import { Body } from './body';

(globalThis => {
  globalThis.Request = class extends Body {
    readonly method: string;
    readonly url: string;
    readonly cache: RequestCache;
    readonly credentials: RequestCredentials;
    readonly destination: RequestDestination;
    readonly integrity: string;
    readonly keepalive: boolean;
    readonly mode: RequestMode;
    readonly redirect: RequestRedirect;
    readonly referrer: string;
    readonly referrerPolicy: ReferrerPolicy;
    // TODO
    readonly signal: any;

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
      this.cache = init?.cache || 'default';
      this.credentials = init?.credentials || 'same-origin';
      this.destination = 'worker';
      this.integrity = init?.integrity || '';
      this.keepalive = init?.keepalive || false;
      this.mode = init?.mode || 'cors';
      this.redirect = init?.redirect || 'follow';
      this.referrer = init?.referrer || '';
      this.referrerPolicy = init?.referrerPolicy || '';
      // this.signal = init?.signal || new AbortSignal();
    }

    clone(): Request {
      return new Request(this.url, {
        method: this.method,
        body: this.body,
        headers: this.headers,
      });
    }
  };
})(globalThis);
