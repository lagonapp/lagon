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

import type { RequestInit } from './runtime/Request';

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
}
