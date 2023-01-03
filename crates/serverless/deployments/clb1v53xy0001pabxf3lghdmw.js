// index.ts
var json = JSON.stringify({
  message: 'Hello World!',
});
function handler(request) {
  return new Response(json, {
    headers: {
      'content-type': 'application/json',
    },
  });
}
export { handler };
