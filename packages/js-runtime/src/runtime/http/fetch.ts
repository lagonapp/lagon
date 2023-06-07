(globalThis => {
  const isHeadersObject = (headers?: HeadersInit): headers is Headers => !!headers && 'entries' in headers;

  const FORCE_0_CONTENT_LENGTH_METHODS = ['POST', 'PUT'];

  globalThis.fetch = async (input, init) => {
    let headers: Map<string, string> | undefined = undefined;

    if (isHeadersObject(init?.headers)) {
      headers = new Map();

      for (const [key, value] of (init?.headers as Headers).entries()) {
        headers.set(key, value);
      }
    } else if (init?.headers) {
      headers = new Map(Object.entries(init.headers));
    }

    let body: string | undefined;

    if (init?.body) {
      if (globalThis.__lagon__.isIterable(init.body)) {
        body = globalThis.__lagon__.TEXT_DECODER.decode(init.body);
      } else {
        if (typeof init.body !== 'string') {
          // TODO: Support other body types
          throw new Error('Body must be a string or an iterable');
        }

        body = init.body;
      }
    }

    if (body === undefined && init?.method && FORCE_0_CONTENT_LENGTH_METHODS.includes(init.method)) {
      if (!headers) {
        headers = new Map();
      }

      headers?.set('content-length', '0');
    }

    const checkAborted = () => {
      if (init?.signal?.aborted) {
        throw new Error('Aborted');
      }
    };

    try {
      checkAborted();

      const response = await LagonAsync.fetch({
        m: init?.method || 'GET',
        u: input.toString(),
        b: body,
        h: headers,
      });

      checkAborted();

      return new Response(response.b, {
        // url: response.init.url,
        headers: response.h,
        status: response.s,
      });
    } catch (error) {
      if (typeof error === 'string') {
        throw new Error(error);
      }

      throw error;
    }
  };
})(globalThis);
