/* eslint-disable no-var */
import './runtime/encoding/TextEncoder';
import './runtime/encoding/TextDecoder';
import './runtime/encoding/base64';
import './runtime/core';
import './runtime/streams';
import './runtime/abort';
import './runtime/global/context';
import './runtime/global/event';
import './runtime/global/blob';
import './runtime/global/file';
import './runtime/global/console';
import './runtime/global/process';
import './runtime/global/crypto';
import './runtime/global/navigator';
import './runtime/global/timers';
import './runtime/http/URLSearchParams';
import './runtime/http/URL';
import './runtime/http/URLPattern';
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
  interface AsyncContextConstructor {
    new (): AsyncContext;
    wrap(callback: (...args: unknown[]) => void): (...args: unknown[]) => void;
  }

  interface AsyncContext<T = unknown> {
    get(): T;
    run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R;
  }

  var AsyncContext: AsyncContextConstructor;

  interface AsyncLocalStorageConstructor {
    new (): AsyncLocalStorage;
  }

  interface AsyncLocalStorage<T = unknown> {
    getStore(): T;
    run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R;
  }

  var AsyncLocalStorage: AsyncLocalStorageConstructor;

  var LagonSync: {
    log: (level: string, message: string) => void;
    pullStream: (id: number, done: boolean, chunk?: Uint8Array) => void;
    uuid: () => `${string}-${string}-${string}-${string}-${string}`;
    randomValues: <T extends ArrayBufferView | null>(array: T) => void;
    getKeyValue: () => ArrayBuffer;
    queueMicrotask: (callback: () => void) => void;
  };

  var LagonAsync: {
    fetch: ({ h, m, b, u }: { h?: Map<string, string>; m: string; b?: string; u: string }) => Promise<{
      b: Uint8Array;
      s: number;
      h?: Record<string, string>;
    }>;
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
    deriveBits(
      algorithm: EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      length: number,
    ): Promise<ArrayBuffer>;
    deriveKey(
      algorithm: EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      derivedKeyType: AesDerivedKeyParams | HmacImportParams,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKey>;
    generateKey(
      algorithm: RsaHashedKeyGenParams | EcKeyGenParams | HmacKeyGenParams | AesKeyGenParams,
    ): Promise<ArrayBuffer>;
    sleep: (ms: number) => Promise<void>;
  };
  var __lagon__: {
    isIterable: (value: unknown) => value is ArrayBuffer;
    parseMultipart: (headers: Headers, body?: string) => FormData;
    TEXT_ENCODER: TextEncoder;
    TEXT_DECODER: TextDecoder;
  };
  var __storage__: Map<AsyncContext, unknown>;
  var handler: (request: Request) => Promise<Response>;
  var masterHandler: (
    id: number,
    request: {
      i: string;
      m: RequestInit['method'];
      h: RequestInit['headers'];
      b: RequestInit['body'];
    },
  ) => Promise<{
    b: string;
    h: ResponseInit['headers'];
    s: ResponseInit['status'];
  }>;

  interface Response {
    readonly isStream: boolean;
  }

  interface Blob {
    readonly buffer: Uint8Array;
  }

  interface Headers {
    immutable: boolean;
  }
}

globalThis.masterHandler = async (id, request) => {
  if (typeof handler !== 'function') {
    throw new Error('Handler function is not defined or is not a function');
  }

  const handlerRequest = new Request(request.i, {
    method: request.m,
    headers: request.h,
    body: request.b,
  });

  const response = await handler(handlerRequest);
  let body: string;

  if (response.isStream) {
    const responseBody = response.body;

    if (!responseBody) {
      throw new Error('Got a stream without a body');
    }

    body = responseBody.toString();
    const reader = responseBody.getReader();

    const read = () => {
      reader.read().then(({ done, value }) => {
        if (done) {
          LagonSync.pullStream(id, done);
          return;
        }

        if (value.byteLength !== 0) {
          LagonSync.pullStream(id, done, value);
        }

        read();
      });
    };

    read();
  } else {
    body = await response.text();
  }

  return {
    b: body,
    h: response.headers,
    s: response.status,
  };
};
