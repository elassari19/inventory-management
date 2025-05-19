/**
 * Redis Utilities for Tenant Isolation
 * Provides utilities for tenant-isolated caching
 */

import { redisClient } from '../lib/redis';

/**
 * TenantRedisService provides tenant-isolated caching services
 * All keys are namespaced by tenant ID to prevent data leakage
 */
export class TenantRedisService {
  private tenantId: string;
  private keyPrefix: string;

  /**
   * Create a new Redis service for a specific tenant
   */
  constructor(tenantId: string) {
    this.tenantId = tenantId;
    // Create a namespace prefix for all Redis keys
    this.keyPrefix = `tenant:${tenantId}:`;
  }

  /**
   * Get a value from Redis cache with tenant isolation
   */
  async get(key: string): Promise<string | null> {
    return redisClient.get(this.prefixKey(key));
  }

  /**
   * Set a value in Redis cache with tenant isolation
   */
  async set(
    key: string,
    value: string,
    expirySeconds?: number
  ): Promise<string> {
    if (expirySeconds) {
      return redisClient.set(this.prefixKey(key), value, 'EX', expirySeconds);
    }
    return redisClient.set(this.prefixKey(key), value);
  }

  /**
   * Delete a value from Redis cache with tenant isolation
   */
  async del(key: string): Promise<number> {
    return redisClient.del(this.prefixKey(key));
  }

  /**
   * Get hash field from Redis cache with tenant isolation
   */
  async hGet(key: string, field: string): Promise<string | null> {
    return redisClient.hget(this.prefixKey(key), field);
  }

  /**
   * Set hash field in Redis cache with tenant isolation
   */
  async hSet(key: string, field: string, value: string): Promise<number> {
    return redisClient.hset(this.prefixKey(key), field, value);
  }

  /**
   * Get all hash fields from Redis cache with tenant isolation
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    return redisClient.hgetall(this.prefixKey(key));
  }

  /**
   * Delete all keys for the current tenant
   * Useful for clearing cache when tenant data changes significantly
   */
  async clearAllTenantCache(): Promise<number> {
    const keys = await redisClient.keys(`${this.keyPrefix}*`);
    if (keys.length > 0) {
      return redisClient.del(...keys);
    }
    return 0;
  }

  /**
   * Add tenant namespace prefix to a key
   */
  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}

/**
 * Create a Redis service for a specific tenant
 */
export const getTenantRedisService = (tenantId: string): TenantRedisService => {
  return new TenantRedisService(tenantId);
};
