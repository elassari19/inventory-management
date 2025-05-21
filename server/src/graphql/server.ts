import { ApolloServer } from 'apollo-server-express';
import { Application, Request } from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { RedisCache } from 'apollo-server-cache-redis';
import Redis from 'ioredis';
import { repositories } from '../db/repositories';
import { AuthService } from '../auth/auth.service';
import { InventoryService } from '../services/inventory.service';
import { graphqlRateLimiter } from '../middleware/graphql-rate-limiter';

// Import environment variables
import dotenv from 'dotenv';
import { redisConfig } from '../utils/redis.config';
import { createPerformancePlugin } from './monitoring';
import { createCachePlugin } from './cache-plugin';
dotenv.config();

// Initialize Redis client for Apollo Cache
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create Apollo Server instance
export const createApolloServer = async (app: Application) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    cache: new RedisCache(redisConfig),
    context: async ({ req }) => {
      // Get user and tenant context
      const user = req.user;
      const tenant = req.tenant;
      const device = req.device;

      // Check rate limits if we have a user and tenant
      if (user && tenant) {
        const rateLimit = await graphqlRateLimiter(user, tenant);
        // Add rate limit info to response headers
        req.res?.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        req.res?.setHeader('X-RateLimit-Reset', rateLimit.resetMs);
      }

      return {
        user,
        tenant,
        device,
        // Add repositories for data access
        repositories,
        // Add services that might be needed in resolvers
        services: {
          auth: AuthService,
          inventory: InventoryService,
        },
      };
    },
    plugins: [createPerformancePlugin(), createCachePlugin()],
  });

  await server.start();
  console.log('Apollo Server started');

  // Apply Apollo middleware to Express
  server.applyMiddleware({
    app,
    cors: true,
    path: '/graphql',
  });

  return server;
};
