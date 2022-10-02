export * from './runtime/base64';
export * from './runtime/encoding';
export * from './runtime/Request';
export * from './runtime/Response';
export * from './runtime/URL';
export * from './runtime/parseMultipart';
export * from './runtime/fetch';
// export * from './streams';

import './runtime/console';
import './runtime/process';

import { TextDecoder } from './runtime/encoding';
import { Request, RequestInit } from './runtime/Request';
import { Response } from './runtime/Response';

declare global {
  const Lagon: {
    log: (message: string) => void;
    fetch: (
      resource: string,
      init: RequestInit,
    ) => {
      body: string;
    };
  };
  const handler: (request: Request) => Promise<Response>;
}

export async function masterHandler(request: { input: string } & Request): Promise<Response> {
  const handlerRequest = new Request(request.input, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await handler(handlerRequest);

  if (response.body instanceof Uint8Array) {
    response.body = new TextDecoder().decode(response.body);
  }

  return response;
}
