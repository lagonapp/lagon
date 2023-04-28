import { RequestResponseBody } from './body';

(globalThis => {
  globalThis.Request = class extends RequestResponseBody {
    readonly method: string;
    readonly cache: RequestCache;
    readonly credentials: RequestCredentials;
    readonly destination: RequestDestination;
    readonly integrity: string;
    readonly keepalive: boolean;
    readonly mode: RequestMode;
    readonly redirect: RequestRedirect;
    readonly referrer: string;
    readonly referrerPolicy: ReferrerPolicy;

    private readonly init?: RequestInit;
    private readonly input: RequestInfo | URL;

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (input instanceof Request && input.bodyUsed) {
        throw new TypeError('nnot construct a Request with a Request object that has already been used.');
      }

      super(init?.body, init?.headers);

      this.init = init;
      this.input = input;

      this.method = init?.method || 'GET';
      this.cache = init?.cache || 'default';
      this.credentials = init?.credentials || 'same-origin';
      this.destination = 'worker';
      this.integrity = init?.integrity || '';
      this.keepalive = init?.keepalive || false;
      this.mode = init?.mode || 'cors';
      this.redirect = init?.redirect || 'follow';
      this.referrer = init?.referrer || '';
      this.referrerPolicy = init?.referrerPolicy || '';
    }

    get url(): string {
      return this.input.toString();
    }

    get signal(): AbortSignal {
      return this.init?.signal || new AbortSignal();
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
