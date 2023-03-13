export function handler() {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  writer.write(new TextEncoder().encode('Hello'));
  writer.write(new TextEncoder().encode(' '));
  writer.write(new TextEncoder().encode('world'));
  writer.close();

  return new Response(readable);
}
