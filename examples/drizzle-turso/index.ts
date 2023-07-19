import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import { users } from './schema';

const client = createClient({
  url: process.env.TURSO_URL ?? '',
  authToken: process.env.TURSO_TOKEN,
});

const db = drizzle(client, { schema: { users } });

export async function handler(): Promise<Response> {
  try {
    const allUsers = await db.select().from(users).all();

    // You can also use the query builder:
    // const allUsers = await db.query.users.findMany();

    // You can also do raw queries:
    // import { sql } from 'drizzle-orm';
    // const result = await db.select(sql`SELECT 'Hello World!'`);

    return Response.json({ allUsers });
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
