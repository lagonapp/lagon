import { Body } from './body';

(globalThis => {
  globalThis.Response = class extends Body {
    headers: Headers;
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    // TODO
    redirected: any;
    type: any;
    clone: any;
    bodyUsed: any;
    blob: any;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body);

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          this.headers = init.headers;
        } else {
          this.headers = new Headers(init.headers);
        }
      } else {
        this.headers = new Headers();
      }

      if (init?.status) {
        this.ok = init.status >= 200 && init.status < 300;
      } else {
        this.ok = true;
      }

      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.url = init?.url || '';
    }

    static error(): Response {
      // TODO
      throw new Error('Not implemented');
    }

    static redirect(url: string | URL, status?: number): Response {
      // TODO
      throw new Error('Not implemented');
    }
  };
})(globalThis);
