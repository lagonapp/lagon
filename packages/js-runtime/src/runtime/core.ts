(globalThis => {
  const isIterable = (value: unknown): value is ArrayBuffer =>
    typeof value !== 'string' && Symbol.iterator in Object(value);

  const parseMultipart = (headers: Headers, body?: string): FormData => {
    const formData = new FormData();

    if (!body) {
      return formData;
    }

    const contentTypeHeader = headers.get('content-type');
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
      if (part?.includes('Content-Disposition')) {
        const content = part.split('; name="')?.[1].split('\n\n');

        if (content) {
          const [name, value] = content;

          formData.append(name.split('"')[0], value.replace('\n--', ''));
        }
      }
    }

    return formData;
  };

  const TEXT_ENCODER = new TextEncoder();
  const TEXT_DECODER = new TextDecoder();

  globalThis.__lagon__ = {
    isIterable,
    parseMultipart,
    TEXT_ENCODER,
    TEXT_DECODER,
  };
})(globalThis);
