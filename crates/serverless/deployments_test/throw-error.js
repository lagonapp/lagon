export function handler() {
  throw new Error('hello');
  return new Response('Hello world');
}
