import { Wrapper } from './App';
import { renderToReadableStream } from 'react-dom/server';
import React from 'react';

export async function handler(request: Request): Promise<Response> {
  const stream = await renderToReadableStream(<Wrapper />);

  return new Response(stream, {
    headers: {
      'content-type': 'text/html',
    },
  });
}
