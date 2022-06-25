import render from 'preact-render-to-string';
import { h } from 'preact';
/** @jsx h */

const App = () => (
  <div>
    <h1>Hello World!</h1>
  </div>
);

const html = render(<App />);

export async function handler(request: Request): Promise<Response> {
  return new Response(html, {
    headers: {
      'content-type': 'text/html',
    },
  });
}
