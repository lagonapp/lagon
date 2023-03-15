export function handler() {
  return new Response('body', {
    status: 201,
    headers: {
      'content-type': 'text/plain',
      'x-custom': 'custom',
    },
  });
}
