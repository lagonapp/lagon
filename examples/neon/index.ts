import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function handler(): Promise<Response> {
  try {
    const results = await sql`SELECT 'Hello World!'`;

    return Response.json(results);
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
