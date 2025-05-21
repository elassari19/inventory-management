import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { redisClient } from '../lib/redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const subscriptionLimits: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 1 request per second on average
  },
  pro: {
    windowMs: 60 * 1000,
    maxRequests: 300, // 5 requests per second on average
  },
  enterprise: {
    windowMs: 60 * 1000,
    maxRequests: 1200, // 20 requests per second on average
  },
};

export async function graphqlRateLimiter(user: any, tenant: any) {
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  if (!tenant) {
    throw new ForbiddenError('No tenant context');
  }

  const subscription = await redisClient.get(`subscription:${user.id}`);
  const plan = subscription ? JSON.parse(subscription).plan : 'free';
  const limits = subscriptionLimits[plan];

  const key = `ratelimit:${tenant.id}:${user.id}`;
  const current = await redisClient.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limits.maxRequests) {
    throw new ForbiddenError('Rate limit exceeded');
  }

  // Increment counter with expiry
  if (count === 0) {
    await redisClient.setex(key, limits.windowMs / 1000, '1');
  } else {
    await redisClient.incr(key);
  }

  // Return remaining requests for client info
  return {
    remaining: limits.maxRequests - (count + 1),
    resetMs: limits.windowMs,
  };
}
