export function handler(request) {
  return new Response(null, {
    headers: request.headers,
  });
}
