/**
 * Cache Middleware
 * Provides request-level access to tenant-specific cache services
 */

import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenant.middleware';
import { getTenantCache, TenantCache } from '../services/cache.service';

/**
 * Extended request interface with cache
 */
export interface CacheRequest extends TenantRequest {
  cache?: TenantCache;
}

/**
 * Middleware to add tenant-specific cache to request
 * This should be used after tenant middleware
 */
export const addCacheToRequest = (
  req: CacheRequest,
  res: Response,
  next: NextFunction
): void => {
  // Only add cache if tenant is identified
  if (req.tenantId) {
    req.cache = getTenantCache(req.tenantId);
  }
  next();
};

/**
 * Middleware to cache API responses
 * Uses tenant-specific caching with proper isolation
 */
export const cacheResponse = (
  keyGenerator: (req: CacheRequest) => string,
  ttlSeconds: number = 300
) => {
  return async (
    req: CacheRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Skip caching if no tenant or cache is available
    if (!req.cache || !req.tenantId) {
      return next();
    }

    try {
      // Generate cache key based on request
      const cacheKey = keyGenerator(req);

      // Try to get from cache
      const cachedData = await req.cache.get(cacheKey);

      if (cachedData) {
        // Return cached response
        res.json(cachedData);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override res.json method to cache before sending
      res.json = ((data: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Import CacheType from cache service
          const { CacheType } = require('../services/cache.service');

          // Convert TTL seconds to appropriate cache type
          let cacheType;
          if (ttlSeconds <= 300) {
            cacheType = CacheType.VOLATILE;
          } else if (ttlSeconds <= 1800) {
            cacheType = CacheType.STANDARD;
          } else if (ttlSeconds <= 7200) {
            cacheType = CacheType.EXTENDED;
          } else {
            cacheType = CacheType.PERSISTENT;
          }

          req.cache?.set(cacheKey, data, cacheType);
        }

        // Call original json method
        return originalJson(data);
      }) as any;

      next();
    } catch (error) {
      // If caching fails, just continue without caching
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Helper to create standard cache keys
 */
export const createCacheKey = {
  forEntity: (entityName: string, id: string): string => {
    return `entity:${entityName}:${id}`;
  },

  forCollection: (entityName: string, queryParams: string): string => {
    return `collection:${entityName}:${queryParams}`;
  },

  forUserData: (userId: string, dataType: string): string => {
    return `user:${userId}:${dataType}`;
  },

  forRequest: (req: CacheRequest): string => {
    // Create a unique key from URL path and query params
    const params = new URLSearchParams(req.query as Record<string, string>);
    params.sort(); // Sort for consistency
    return `request:${req.path}:${params.toString()}`;
  },
};

export default {
  addCacheToRequest,
  cacheResponse,
  createCacheKey,
};
