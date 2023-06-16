(globalThis => {
  const FORCE_0_CONTENT_LENGTH_METHODS = ['POST', 'PUT'];

  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    let body: string | undefined;

    const isInputRequest = input instanceof Request

    if (init?.body || (isInputRequest && (input as Request).body)) {
      const paramBody = init?.body || (input as Request).body;

      if (globalThis.__lagon__.isIterable(paramBody)) {
        body = globalThis.__lagon__.TEXT_DECODER.decode(paramBody);
      } else if (paramBody instanceof ReadableStream) {
        body = '';

        const reader = paramBody.getReader();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          body += globalThis.__lagon__.TEXT_DECODER.decode(value);
        }
      } else {
        if (typeof paramBody !== 'string') {
          // TODO: Support other body types
          throw new Error('Body must be a string or an iterable');
        }

        body = paramBody
      }
    }

    let method = init?.method || 'GET';
    let url = input.toString();

    if (isInputRequest) {
      for (const [key, value] of (input as Request).headers.entries()) {
        headers.set(key, value);
      }

      method = init?.method || (input as Request).method;
      url = (input as Request).url.toString();
    }

    if (body === undefined && init?.method && FORCE_0_CONTENT_LENGTH_METHODS.includes(init.method)) {
      headers.set('content-length', '0');
    }

    const checkAborted = () => {
      if (init?.signal?.aborted) {
        throw new Error('Aborted');
      }
    };

    try {
      checkAborted();

      const response = await LagonAsync.fetch({
        m: method,
        u: url,
        b: body,
        // @ts-expect-error private property
        h: headers.h,
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
