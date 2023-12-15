(globalThis => {
  const MULTIPART_FORMDATA_CONTENTYPE = 'multipart/form-data';
  const CONTENT_DISPOSITION = 'Content-Disposition';
  const APPLICATION_X_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';

  const isIterable = (value: unknown): value is ArrayBuffer =>
    typeof value !== 'string' && Symbol.iterator in Object(value);

  const parseMultipart = (headers: Headers, body?: string): FormData => {
    const formData = new FormData();

    if (!body) {
      return formData;
    }

    const contentTypeHeader = headers.get('content-type');

    if (contentTypeHeader?.startsWith(APPLICATION_X_WWW_FORM_URLENCODED)) {
      const params = new URLSearchParams(body);

      for (const [key, value] of params) {
        formData.append(key, value);
      }

      return formData;
    } else if (contentTypeHeader?.startsWith(MULTIPART_FORMDATA_CONTENTYPE)) {
      let boundary: string | undefined;

      const getBoundary = (header: string | null) => header?.split(';')?.[1]?.split('=')?.[1];

      if (Array.isArray(contentTypeHeader)) {
        contentTypeHeader.forEach(header => {
          if (!boundary) {
            boundary = getBoundary(header);
          }
        });
      } else {
        boundary = getBoundary(contentTypeHeader);
      }

      if (!boundary) {
        return formData;
      }

      for (const part of body.split(boundary)) {
        if (part?.includes(CONTENT_DISPOSITION)) {
          const content = part.split('; name="')?.[1].split('\n\n');

          if (content) {
            const [name, value] = content;

            formData.append(name.split('"')[0], value.replace('\n--', ''));
          }
        }
      }

      return formData;
    } else {
      throw new Error(`Unsupported content type: ${contentTypeHeader}`);
    }
  };

  const TEXT_ENCODER = new TextEncoder();
  const TEXT_DECODER = new TextDecoder();

  // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/self
  // @ts-expect-error Workers have a global `self` property, which we assign
  // to `globalThis` because we don't implement all the Workers APIs
  globalThis.self = globalThis;
  globalThis.__lagon__ = {
    isIterable,
    parseMultipart,
    TEXT_ENCODER,
    TEXT_DECODER,
  };
})(globalThis);
