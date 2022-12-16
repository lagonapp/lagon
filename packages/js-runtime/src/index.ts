/* eslint-disable no-var */
import './runtime/encoding/TextEncoder';
import './runtime/encoding/TextDecoder';
import './runtime/encoding/base64';
import './runtime/core';
import './runtime/streams';
import './runtime/abort';
import './runtime/blob';
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
    log: (level: string, message: string) => void;
    fetch: ({ h, m, b, u }: { h?: Map<string, string>; m: string; b?: string; u: string }) => Promise<{
      b: Uint8Array;
      s: number;
      h?: Record<string, string>;
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
    digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>;
    encrypt: (
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ) => Promise<ArrayBuffer>;
    decrypt: (
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ) => Promise<ArrayBuffer>;
  };
  var __lagon__: {
    isIterable: (value: unknown) => value is ArrayBuffer;
    parseMultipart: (headers: Headers, body?: string) => FormData;
    TEXT_ENCODER: TextEncoder;
    TEXT_DECODER: TextDecoder;
  };
  var handler: (request: Request) => Promise<Response>;

  interface Response {
    readonly isStream: boolean;
  }
}

export async function masterHandler(request: {
  i: string;
  m: RequestInit['method'];
  h: RequestInit['headers'];
  b: RequestInit['body'];
}): Promise<{
  b: string;
  h: ResponseInit['headers'];
  s: ResponseInit['status'];
}> {
  if (typeof handler !== 'function') {
    throw new Error('Handler function is not defined or is not a function');
  }

  const handlerRequest = new Request(request.i, {
    method: request.m,
    headers: request.h,
    body: request.b,
  });

  const response = await handler(handlerRequest);

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

  return {
    b: response.body as unknown as string,
    h: response.headers,
    s: response.status,
  };
}
