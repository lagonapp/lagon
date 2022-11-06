(globalThis => {
  const isHeadersObject = (headers?: HeadersInit): headers is Headers => !!headers && 'entries' in headers;

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

    try {
      const response = await Lagon.fetch({
        method: init?.method || 'GET',
        url: input.toString(),
        body,
        headers,
      });

      return new Response(response.body, {
        // url: response.init.url,
        headers: response.headers,
        status: response.status,
      });
    } catch (error) {
      // error is always a string
      throw new Error(error as string);
    }
  };
})(globalThis);
