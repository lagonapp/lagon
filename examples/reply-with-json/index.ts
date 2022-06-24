const json = JSON.stringify({
  message: 'Hello World!',
});

export function handler(request: Request): Response {
  return new Response(json, {
    headers: {
      'content-type': 'application/json',
    },
  });
}
