import Redis from 'ioredis';

// Redis client setup
export const redisClient = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
