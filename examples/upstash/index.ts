import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function handler(): Promise<Response> {
  await redis.set('hello', 'world');
  const data = (await redis.get('hello')) as string;

  return new Response(`Hello ${data}!`);
}
