import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './schema.ts',
  out: './migrations',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_URL ?? '',
    authToken: process.env.TURSO_TOKEN,
  },
} satisfies Config;
