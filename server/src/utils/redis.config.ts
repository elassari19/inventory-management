import Redis from 'ioredis';
import ConnectRedis from 'connect-redis';
import session from 'express-session';

// Redis client setup
export const redisClient = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379'
);

// Create Redis store with proper error handling
export const RedisStore = new ConnectRedis({
  client: redisClient,
  prefix: 'session:',
  disableTouch: true,
});

export const redisSession = session({
  store: RedisStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
});

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};
