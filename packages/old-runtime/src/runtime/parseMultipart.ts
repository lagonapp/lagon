import { Headers } from './fetch';

export const parseMultipart = (headers: Headers, body?: string) => {
  if (!body) {
    return {};
  }

  const contentTypeHeader = headers.get('content-type');
  let boundary: string | undefined;

  const getBoundary = (header: string | undefined) => header?.split(';')?.[1]?.split('=')?.[1];

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
    return {};
  }

  const result: Record<string, string> = {};

  for (const part of body.split(boundary)) {
    if (part?.includes('Content-Disposition')) {
      const content = part.split('name="')?.[1].split('"\\r\\n\\r\\n');

      if (content) {
        const [name, value] = content;

        result[name] = value.replace('\\r\\n\\r\\n--', '');
      }
    }
  }

  return result;
};
