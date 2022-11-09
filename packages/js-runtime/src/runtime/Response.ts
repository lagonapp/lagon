import { Body } from './body';

(globalThis => {
  globalThis.Response = class extends Body {
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

      super(body, headers);

      if (init?.status) {
        this.ok = init.status >= 200 && init.status < 300;
      } else {
        this.ok = true;
      }

      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      // TODO: investigate
      // @ts-expect-error ResponseInit doesn't have url
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
