import React from 'react';
import { renderToString } from 'react-dom/server';

const App = () => (
  <div>
    <h1>Hello World!</h1>
  </div>
);

const html = renderToString(<App />);

export async function handler(request: Request): Promise<Response> {
  return new Response(html, {
    headers: {
      'content-type': 'text/html',
    },
  });
}
