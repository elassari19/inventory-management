/**
 * Cache Service
 * Provides comprehensive caching functionality with tenant isolation
 */

import { redisClient } from '../lib/redis';
import { TenantRedisService } from '../utils/redis.utils';

/**
 * Cache Types with different TTLs
 */
export enum CacheType {
  VOLATILE = 'volatile', // Short-lived cache (5 minutes)
  STANDARD = 'standard', // Standard cache (30 minutes)
  EXTENDED = 'extended', // Longer cache (2 hours)
  PERSISTENT = 'persistent', // Very long cache (24 hours)
}

/**
 * Default TTLs in seconds for different cache types
 */
const DEFAULT_TTL = {
  [CacheType.VOLATILE]: 5 * 60, // 5 minutes
  [CacheType.STANDARD]: 30 * 60, // 30 minutes
  [CacheType.EXTENDED]: 2 * 60 * 60, // 2 hours
  [CacheType.PERSISTENT]: 24 * 60 * 60, // 24 hours
};

/**
 * Cache statistics for monitoring and optimization
 */
export class CacheStats {
  private hits: number = 0;
  private misses: number = 0;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  public recordHit(): void {
    this.hits++;
    // Periodically save stats to Redis
    if ((this.hits + this.misses) % 100 === 0) {
      this.saveStats();
    }
  }

  public recordMiss(): void {
    this.misses++;
    // Periodically save stats to Redis
    if ((this.hits + this.misses) % 100 === 0) {
      this.saveStats();
    }
  }

  public getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  private async saveStats(): Promise<void> {
    try {
      await redisClient.hset(`cache:stats:${this.tenantId}`, {
        hits: this.hits.toString(),
        misses: this.misses.toString(),
        hitRate: this.getHitRate().toString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save cache stats', error);
    }
  }

  public static async getStats(tenantId: string): Promise<any> {
    try {
      return await redisClient.hgetall(`cache:stats:${tenantId}`);
    } catch (error) {
      console.error('Failed to get cache stats', error);
      return { error: 'Failed to get cache stats' };
    }
  }
}

/**
 * Enhanced TenantCache with advanced caching patterns and monitoring
 */
export class TenantCache {
  private tenantRedis: TenantRedisService;
  private stats: CacheStats;

  constructor(tenantId: string) {
    this.tenantRedis = new TenantRedisService(tenantId);
    this.stats = new CacheStats(tenantId);
  }

  /**
   * Get a value from cache with stats tracking
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.tenantRedis.get(key);

      if (data) {
        this.stats.recordHit();
        return JSON.parse(data) as T;
      }

      this.stats.recordMiss();
      return null;
    } catch (error) {
      console.error(`Cache get error for key: ${key}`, error);
      this.stats.recordMiss();
      return null;
    }
  }

  /**
   * Set a value in cache with appropriate TTL
   */
  async set<T>(
    key: string,
    value: T,
    type: CacheType = CacheType.STANDARD
  ): Promise<boolean> {
    try {
      const ttl = DEFAULT_TTL[type];
      await this.tenantRedis.set(key, JSON.stringify(value), ttl);
      return true;
    } catch (error) {
      console.error(`Cache set error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Read-through cache pattern:
   * Get from cache first, if not found, execute dataFn and cache result
   */
  async getOrSet<T>(
    key: string,
    dataFn: () => Promise<T>,
    type: CacheType = CacheType.STANDARD
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute data function
    const data = await dataFn();

    // Save to cache if data exists
    if (data !== null && data !== undefined) {
      await this.set(key, data, type);
    }

    return data;
  }

  /**
   * Remove a key from cache
   */
  async invalidate(key: string): Promise<boolean> {
    try {
      await this.tenantRedis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache invalidation error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Invalidate multiple keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.tenantRedis.keys(pattern);

      if (keys.length > 0) {
        // Delete keys one by one to avoid spread operator issues
        for (const key of keys) {
          await this.tenantRedis.del(
            key.replace(this.tenantRedis.getTenantId() + ':', '')
          );
        }
      }

      return true;
    } catch (error) {
      console.error(
        `Cache pattern invalidation error for pattern: ${pattern}`,
        error
      );
      return false;
    }
  }

  /**
   * Cache data in a hash structure
   */
  async hSet(
    key: string,
    field: string,
    value: any,
    ttl?: number
  ): Promise<boolean> {
    try {
      await this.tenantRedis.hSet(key, field, JSON.stringify(value));

      // Set expiry on the entire hash if TTL provided
      if (ttl) {
        await this.tenantRedis.expire(key, ttl);
      }

      return true;
    } catch (error) {
      console.error(`Cache hSet error for key: ${key}, field: ${field}`, error);
      return false;
    }
  }

  /**
   * Get data from a hash structure
   */
  async hGet<T>(key: string, field: string): Promise<T | null> {
    try {
      const data = await this.tenantRedis.hGet(key, field);

      if (data) {
        this.stats.recordHit();
        return JSON.parse(data) as T;
      }

      this.stats.recordMiss();
      return null;
    } catch (error) {
      console.error(`Cache hGet error for key: ${key}, field: ${field}`, error);
      this.stats.recordMiss();
      return null;
    }
  }

  /**
   * Get cache statistics for the tenant
   */
  async getStats(): Promise<any> {
    return CacheStats.getStats(this.tenantRedis.getTenantId());
  }

  /**
   * Cache a GraphQL query result
   */
  async cacheGraphQLQuery(
    operationName: string,
    variables: any,
    result: any,
    type: CacheType = CacheType.VOLATILE
  ): Promise<void> {
    await this.tenantRedis.cacheGraphQL(
      operationName,
      variables,
      result,
      DEFAULT_TTL[type]
    );
    this.stats.recordHit();
  }

  /**
   * Get cached GraphQL query result
   */
  async getCachedGraphQLQuery<T>(
    operationName: string,
    variables: any
  ): Promise<T | null> {
    const result = await this.tenantRedis.getCachedGraphQL<T>(
      operationName,
      variables
    );
    if (result) {
      this.stats.recordHit();
    } else {
      this.stats.recordMiss();
    }
    return result;
  }

  /**
   * Invalidate cached GraphQL queries by operation name
   */
  async invalidateGraphQLQueries(operationName: string): Promise<void> {
    await this.tenantRedis.deletePattern(`graphql:${operationName}:*`);
  }
}

/**
 * Create a cache service for a specific tenant
 */
export const getTenantCache = (tenantId: string): TenantCache => {
  return new TenantCache(tenantId);
};
