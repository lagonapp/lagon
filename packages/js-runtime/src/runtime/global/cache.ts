(globalThis => {
  const getUrl = (request: RequestInfo | URL): string => {
    if (typeof request === 'string') {
      return request;
    }
    if (request instanceof Request) {
      return request.url;
    }
    if (request instanceof URL) {
      return request.href;
    }
    throw new Error('request must be string, Request or URL');
  };

  class Cache {
    add(request: RequestInfo | URL) {
      throw new Error('Not implemented');
    }
    addAll(requests: Array<RequestInfo | URL>) {
      throw new Error('Not implemented');
    }
    async delete(request: RequestInfo | URL, options?: MultiCacheQueryOptions) {
      return await LagonAsync.cacheDel(getUrl(request));
    }
    keys(request?: RequestInfo | URL, options?: MultiCacheQueryOptions) {
      throw new Error('Not implemented');
    }
    async match(request: RequestInfo | URL, options?: CacheQueryOptions) {
      try {
        const resMetaData = await LagonAsync.cacheMatch(getUrl(request));
        return new Response(resMetaData.b, {
          headers: {
            ...(resMetaData.h ?? {}),
          },
          status: resMetaData.s,
          statusText: resMetaData.st,
        });
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
    matchAll(request?: RequestInfo | URL, options?: CacheQueryOptions) {
      throw new Error('Not implemented');
    }
    async put(request: RequestInfo | URL, response: Response) {
      const reqMetaData = { h: new Map<string, string>(), u: getUrl(request) };
      if (request instanceof Request) {
        reqMetaData.h = new Map(Object.entries(request.headers ?? {}));
      }

      if (response instanceof Response) {
        const b = await response.text();

        const resMetaData = {
          h: new Map(Object.entries(response?.headers ?? {})),
          s: response?.status,
          b: b,
        };

        return await LagonAsync.cachePut(reqMetaData, resMetaData);
      }
      throw new Error('response must be Response');
    }
  }
  // @ts-expect-error missing `prototype` property
  globalThis.cache = new Cache();
})(globalThis);
