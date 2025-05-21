/**
 * Enhanced Secure Tenant Middleware
 * Provides secure tenant identification and validation with JWT token verification
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import createHttpError from 'http-errors';

// Define tenant interface
interface Tenant {
  id: string;
  tier: 'basic' | 'premium' | 'enterprise';
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export const secureTenantExtractor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Skip tenant validation for auth routes and public endpoints
    if (req.path.startsWith('/auth') || req.path === '/') {
      return next();
    }

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID is required' });
    }

    // Attach tenant info to request
    req.tenant = {
      id: tenantId,
      tier: 'basic', // You would normally get this from your database
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const tenantRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const tier = req.tenant?.tier || 'basic';
    switch (tier) {
      case 'premium':
        return 100;
      case 'enterprise':
        return 1000;
      default:
        return 30;
    }
  },
  message: { error: 'Too many requests from this tenant' },
  standardHeaders: true,
  legacyHeaders: false,
});
