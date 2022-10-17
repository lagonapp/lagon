export * from './runtime/base64';
export * from './runtime/encoding';
export * from './runtime/Request';
export * from './runtime/Response';
export * from './runtime/URL';
export * from './runtime/parseMultipart';
export * from './runtime/fetch';
export * from './runtime/streams';

import './runtime/console';
import './runtime/process';

import { TextDecoder } from './runtime/encoding';
import { Request } from './runtime/Request';
import { Response } from './runtime/Response';
import { ReadableStream } from './runtime/streams';

// Declare the global functions and variables available
// on the runtime, that are injected from the Rust code.
//
// NOTE: we use `var` to that we can refer to these variables
// using `globalThis.VARIABLE`.
declare global {
  // eslint-disable-next-line no-var
  var Lagon: {
    log: (message: string) => void;
    fetch: ({
      headers,
      method,
      body,
      url,
    }: {
      headers?: Map<string, string>;
      method: string;
      body?: string;
      url: string;
    }) => Promise<{
      body: string;
      status: number;
      headers?: Record<string, string>;
    }>;
    pullStream: (done: boolean, chunk?: Uint8Array) => void;
  };
  // eslint-disable-next-line no-var
  var handler: (request: Request) => Promise<Response>;
}

export async function masterHandler(request: { input: string } & Request): Promise<Response> {
  const handlerRequest = new Request(request.input, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await handler(handlerRequest);

  if (response.body instanceof ReadableStream) {
    const reader = response.body.getReader();

    new ReadableStream({
      start: controller => {
        const push = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              Lagon.pullStream(done);
              return;
            }
            controller.enqueue(value);
            Lagon.pullStream(done, value);
            push();
          });
        };
        push();
      },
    });
  } else if (response.body instanceof Uint8Array) {
    response.body = new TextDecoder().decode(response.body);
  }

  return response;
}
