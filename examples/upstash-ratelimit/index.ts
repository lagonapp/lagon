import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.cachedFixedWindow(5, '5 s'),
});

export async function handler(): Promise<Response> {
  const res = await ratelimit.limit('identifier');

  if (res.success) {
    return new Response(JSON.stringify(res, null, 2), { status: 200 });
  } else {
    return new Response(JSON.stringify({ res }, null, 2), { status: 429 });
  }
}
