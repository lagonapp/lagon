import { RequestResponseBody } from './body';

(globalThis => {
  // https://fetch.spec.whatwg.org/#null-body-status
  const NULL_BODY_STATUS = [101, 103, 204, 205, 304];
  // https://fetch.spec.whatwg.org/#redirect-status
  const REDIRECT_STATUS = [301, 302, 303, 307, 308];

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
        if (!!body && NULL_BODY_STATUS.includes(init.status)) {
          throw new TypeError('Response with null body status cannot have body');
        }

        if (init.status < 200 || init.status > 599) {
          throw new RangeError('Invalid status code');
        }

        this.ok = init.status >= 200 && init.status < 300;
      } else {
        this.ok = true;
      }

      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? '';
      // TODO: investigate
      // @ts-expect-error ResponseInit doesn't have url
      this.url = init?.url || '';
      this.type = 'default';
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
      const response = new Response(null, {
        status: 0,
      });
      // @ts-expect-error we modify a read-only property
      response.type = 'error';
      response.headers.immutable = true;

      return response;
    }

    static redirect(url: string | URL, status = 302): Response {
      if (!REDIRECT_STATUS.includes(status)) {
        throw new RangeError('Invalid status code');
      }

      const response = new Response(null, {
        status,
        headers: {
          Location: new URL(url).toString(),
        },
      });
      // @ts-expect-error we modify a read-only property
      response.type = 'default';

      return response;
    }

    static json(data?: BodyInit | null, init?: ResponseInit): Response {
      const body = JSON.stringify(data);

      if (body === undefined) {
        throw new TypeError('The data is not serializable');
      }

      const headers = new Headers(init?.headers);

      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }

      return new Response(body, {
        ...init,
        headers,
      });
    }
  };
})(globalThis);
