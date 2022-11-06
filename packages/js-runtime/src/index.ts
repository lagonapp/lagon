/* eslint-disable no-var */
import './runtime/encoding/TextEncoder';
import './runtime/encoding/TextDecoder';
import './runtime/encoding/base64';
import './runtime/core';
import './runtime/streams';
import './runtime/abort';
import './runtime/global/console';
import './runtime/global/process';
import './runtime/global/crypto';
import './runtime/http/URLSearchParams';
import './runtime/http/URL';
import './runtime/http/Headers';
import './runtime/http/FormData';
import './runtime/http/Response';
import './runtime/http/Request';
import './runtime/http/fetch';

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
    uuid: () => string;
    randomValues: <T extends ArrayBufferView | null>(array: T) => T;
    sign: (
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      data: BufferSource,
    ) => Promise<ArrayBuffer>;
    verify: (
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      signature: BufferSource,
      data: BufferSource,
    ) => Promise<boolean>;
    getKeyValue: () => ArrayBuffer;
  };
  var __lagon__: {
    isIterable: (value: unknown) => value is ArrayBuffer;
    parseMultipart: (headers: Headers, body?: string) => FormData;
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

  // @ts-expect-error isStream is not part of the spec in Response
  if (response.body && response.isStream) {
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
  } else {
    // @ts-expect-error we reassign body even if it's readonly
    response.body = await response.text();
  }

  return response;
}
