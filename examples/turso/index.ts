import { createClient } from '@libsql/client/web';

export async function handler(): Promise<Response> {
  try {
    const client = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN,
    });

    const rs = await client.execute("SELECT 'Hello World!'");

    return Response.json(rs);
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
