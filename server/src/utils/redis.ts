import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue:   false,
  lazyConnect:          true,
  retryStrategy:        () => null, // Never retry — fail silently
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error',   () => {}); // Suppress all Redis error logs when not installed

export default redis;
