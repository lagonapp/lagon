import { createRequestHandler } from '@lagon/remix';
import * as build from '@remix-run/dev/server-build';

const requestHandler = createRequestHandler({ build, mode: process.env.NODE_ENV });

export function handler(request) {
  return requestHandler(request);
}
