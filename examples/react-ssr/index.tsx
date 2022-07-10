import App from './App';
import { renderToReadableStream } from 'react-dom/server';
import React from 'react';

// const html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <meta http-equiv="X-UA-Compatible" content="ie=edge">
//   <link rel="stylesheet" href="/main.css">
// </head>
// <body>
//   <div id="root">${renderToString(<App />)}</div>
//   <script type="module" src="/app.js"></script>
// </body>
// </html>`;

export async function handler(request: Request): Promise<Response> {
  const stream = await renderToReadableStream(<App />);

  return new Response(stream, {
    headers: {
      'content-type': 'text/html',
    },
  });
}
