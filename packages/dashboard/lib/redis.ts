import { createClient, RedisClientType } from 'redis';

declare const global: typeof globalThis & {
  redis: RedisClientType;
};

let redis = global.redis;

if (!redis) {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    pingInterval: 1000,
  });

  // TODO: await?
  // await redisClient.connect();
  redisClient.connect();

  redis = redisClient as RedisClientType;
}

if (process.env.NODE_ENV === 'development') global.redis = redis;

export default redis;
