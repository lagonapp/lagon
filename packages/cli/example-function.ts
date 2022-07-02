export function handler(request: Request): Response {
  console.log('Request:', process.env);
  return new Response('Hello from CLI');
}
