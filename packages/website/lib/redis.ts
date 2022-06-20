import { createClient, RedisClientType } from 'redis';

// @ts-expect-error NodeJS.Global does not exists
interface CustomNodeJsGlobal extends NodeJS.Global {
  redis: RedisClientType;
}

declare const global: CustomNodeJsGlobal;

let redis = global.redis;

if (!redis) {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  // TODO: await?
  // await redisClient.connect();
  redisClient.connect();

  redis = redisClient as RedisClientType;
}

if (process.env.NODE_ENV === 'development') global.redis = redis;

export default redis;
