/**
 * Enhanced Secure Tenant Middleware
 * Provides secure tenant identification and validation with JWT token verification
 */

import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '../repositories/tenant.repository';
import jwt from 'jsonwebtoken';
import { TenantRequest } from './tenant.middleware';
import { TenantRedisService } from '../utils/redis.utils';

// JWT Secret from environment variable or use a default (for development only)
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';

/**
 * Verify JWT token and extract tenant information
 */
export const verifyToken = (
  token: string
): { tenantId: string; userId: string } | null => {
  try {
    // Verify the token using the secret
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if tenantId is present in the token
    if (!decoded.tenantId) {
      console.warn('JWT token missing tenantId claim:', decoded);
      return null;
    }

    return {
      tenantId: decoded.tenantId,
      userId: decoded.userId || decoded.sub,
    };
  } catch (error) {
    console.error('JWT token verification error:', error);
    return null;
  }
};

/**
 * Extract and validate token from Authorization header
 */
export const extractTokenFromHeader = (
  req: Request | TenantRequest
): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

/**
 * Extract tenant information and validate JWT token
 */
export const secureTenantExtractor = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Method 1: Extract from subdomain (same as before)
    const host = req.headers.host || '';
    const subdomainMatch = host.match(/^([^.]+)\.ventory\.app$/);

    if (
      subdomainMatch &&
      subdomainMatch[1] !== 'www' &&
      subdomainMatch[1] !== 'api'
    ) {
      req.tenantId = subdomainMatch[1];
    }

    // Method 2: Extract from custom header (same as before)
    if (!req.tenantId && req.headers['x-tenant-id']) {
      req.tenantId = req.headers['x-tenant-id'] as string;
    }

    // Method 3: Extract from JWT token (enhanced security)
    if (!req.tenantId) {
      const token = extractTokenFromHeader(req);
      if (token) {
        const tokenData = verifyToken(token);
        if (tokenData && tokenData.tenantId) {
          req.tenantId = tokenData.tenantId;

          // If user object doesn't exist, create one from token
          if (!req.user) {
            req.user = {
              id: tokenData.userId,
              tenantId: tokenData.tenantId,
            };
          }
        }
      }
    }

    // If no tenant ID was found, handle public endpoints
    if (!req.tenantId) {
      // Check if this is a public endpoint (same as before)
      const isPublicEndpoint =
        req.path.startsWith('/api/auth/') ||
        req.path === '/api/health' ||
        req.path === '/api/tenants/register';

      if (!isPublicEndpoint) {
        return res.status(401).json({
          error: 'Tenant identification required',
          message: 'Valid tenant identification is required for this resource',
        });
      }
    } else {
      try {
        // Validate tenant exists and is active
        const tenant = await tenantRepository.findBySlug(req.tenantId);

        if (tenant) {
          if (!tenant.active) {
            return res.status(403).json({
              error: 'Tenant inactive',
              message: 'This tenant account has been deactivated',
            });
          }

          req.tenant = tenant;

          // Ensure consistent tenantId between token and request
          if (
            req.user &&
            req.user.tenantId &&
            req.user.tenantId !== tenant.id
          ) {
            return res.status(403).json({
              error: 'Tenant mismatch',
              message: 'Token tenant does not match requested tenant',
            });
          }
        } else {
          return res.status(404).json({
            error: 'Tenant not found',
            message: 'The specified tenant does not exist',
          });
        }
      } catch (error) {
        console.error('Error loading tenant data:', error);
        return res.status(500).json({ error: 'Error loading tenant data' });
      }
    }

    next();
  } catch (error) {
    console.error('Error in secure tenant middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Rate limiting middleware based on tenant tier
 */
export const tenantRateLimiter = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  // Only apply rate limiting if we have tenant information
  if (req.tenant) {
    // Different rate limits based on tenant tier
    let rateLimit: number;

    switch (req.tenant.tier) {
      case 'FREE':
        rateLimit = 60; // 60 requests per minute
        break;
      case 'BASIC':
        rateLimit = 300; // 300 requests per minute
        break;
      case 'PREMIUM':
        rateLimit = 600; // 600 requests per minute
        break;
      case 'ENTERPRISE':
        rateLimit = 1200; // 1200 requests per minute
        break;
      default:
        rateLimit = 60; // Default to FREE tier
    }

    // In a real implementation, you would check a Redis counter here
    // For now, we'll just pass through

    // Example of how you would implement rate limiting:
    // const redisClient = new TenantRedisService(req.tenant.id);
    // const key = `rate-limit:${Math.floor(Date.now() / 60000)}`;
    // const count = await redisClient.get(key);
    // const currentCount = count ? parseInt(count) : 0;
    // if (currentCount >= rateLimit) {
    //   return res.status(429).json({
    //     error: 'Rate limit exceeded',
    //     message: 'Please upgrade your plan or try again later'
    //   });
    // }
    // await redisClient.set(key, (currentCount + 1).toString(), 60); // Expire after 60 seconds
  }

  next();
};

export default { secureTenantExtractor, tenantRateLimiter };
