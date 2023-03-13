export function handler(request) {
  const url = new URL(request.url);

  return new Response('Dynamic asset: ' + url.pathname);
}
