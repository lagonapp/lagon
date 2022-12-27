import type { AdapterRequestContext } from '@hattip/core';

export default (context: AdapterRequestContext) => {
  const { pathname } = new URL(context.request.url);
  if (pathname === '/') {
    return new Response('Hello from HatTip.');
  } else if (pathname === '/about') {
    return new Response('This HTTP handler works in Node.js and Edge runtimes.');
  } else {
    return new Response('Not found.', { status: 404 });
  }
};
