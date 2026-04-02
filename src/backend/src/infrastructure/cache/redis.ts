import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
    });
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await getRedis().get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}
