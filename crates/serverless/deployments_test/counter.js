let count = 0;

export function handler() {
  count += 1;
  return new Response(count.toString());
}
