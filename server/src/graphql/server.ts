import { ApolloServer } from 'apollo-server-express';
import { Application } from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { RedisCache } from 'apollo-server-cache-redis';
import Redis from 'ioredis';

// Import environment variables
import dotenv from 'dotenv';
import { redisConfig } from '../../utils/redis.config';
import { createPerformancePlugin } from './monitoring';
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
    context: ({ req }) => ({
      user: req.user,
    }),
    plugins: [
      // Add performance monitoring plugin
      {
        async serverWillStart() {
          console.log('Apollo Server starting...');
        },
        async requestDidStart() {
          return {
            async willSendResponse({ response }) {
              // Log response time and cache status
              console.log(
                `Request completed: ${response.http?.headers.get(
                  'x-response-time'
                )}ms`
              );
            },
          };
        },
      },
      createPerformancePlugin(),
    ],
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
