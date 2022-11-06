/* eslint-disable no-var */
import './runtime/encoding';
import './runtime/core';
import './runtime/console';
import './runtime/process';
import './runtime/URL';
import './runtime/streams';
import './runtime/base64';
import './runtime/headers';
import './runtime/Response';
import './runtime/Request';
import './runtime/fetch';

// Declare the global functions and variables available
// on the runtime, that are injected from the Rust code.
//
// NOTE: we use `var` to that we can refer to these variables
// using `globalThis.VARIABLE`.
declare global {
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
      body: Uint8Array;
      status: number;
      headers?: Record<string, string>;
    }>;
    pullStream: (done: boolean, chunk?: Uint8Array) => void;
  };
  var __lagon__: {
    isIterable: (value: unknown) => value is ArrayBuffer;
    parseMultipart: (headers: Headers, body?: string) => Record<string, string>;
    TEXT_ENCODER: TextEncoder;
    TEXT_DECODER: TextDecoder;
  };
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
