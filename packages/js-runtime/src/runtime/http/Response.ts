import { RequestResponseBody } from './body';

(globalThis => {
  globalThis.Response = class extends RequestResponseBody {
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    type: ResponseType;
    redirected: boolean;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body, init?.headers);

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
      this.type = 'basic';
      this.redirected = false;
    }

    clone(): Response {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }

    static error(): Response {
      return {
        ...new Response(),
        type: 'error',
      };
    }

    static redirect(url: string | URL, status?: number): Response {
      const response = {
        ...new Response(null, {
          status,
        }),
        url: url.toString(),
      };

      return response;
    }

    static json(data?: BodyInit | null, init?: ResponseInit): Response {
      return new Response(data, {
        ...init,
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
        },
      });
    }
  };
})(globalThis);
