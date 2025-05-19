import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { errorHandler, notFoundHandler } from './errors';

// Import passport configuration
import './auth/passport.config';

// Import routes
import authRouter from './auth/auth.routes';

// Import GraphQL server
import { createApolloServer } from './graphql/server';

import { redisSession } from './utils/redis.config';
import { redisClient } from './lib/redis';

// Import tenant middleware
import { extractTenant, requireTenant } from './middleware/tenant.middleware';
import {
  secureTenantExtractor,
  tenantRateLimiter,
} from './middleware/secure-tenant.middleware';

export const createApp = async () => {
  /* CONFIGURATIONS */
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    })
  );
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
  app.use(morgan('common'));
  app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for screenshots
  app.use(bodyParser.urlencoded({ extended: false }));

  // CORS configuration - remove the previous app.use(cors()) call
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposedHeaders: ['set-cookie'],
    })
  );

  // Add session middleware before passport
  app.use(redisSession);

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Apply secure tenant middleware to all requests
  app.use(secureTenantExtractor);

  // Apply rate limiting based on tenant tier
  app.use(tenantRateLimiter);

  // Routes
  app.use('/auth', authRouter);

  // Protect API routes with tenant validation
  app.use('/api', requireTenant);

  // Initialize Apollo Server - await it properly
  // await createApolloServer(app);
  // console.log('GraphQL server initialized');

  // Root route should be defined before error handlers
  app.get('/', (req, res) => {
    res.send(
      'Greetings from scrapper backend! Visit /graphql to access the GraphQL playground.'
    );
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
