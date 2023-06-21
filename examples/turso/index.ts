import { createClient } from '@libsql/client/web';

const client = createClient({
  url: process.env.TURSO_URL ?? '',
  authToken: process.env.TURSO_TOKEN,
});

export async function handler(): Promise<Response> {
  try {
    const result = await client.execute("SELECT 'Hello World!'");

    return Response.json(result);
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
