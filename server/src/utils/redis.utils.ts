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
   * Get the tenant ID for this service
   */
  getTenantId(): string {
    return this.tenantId;
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
   * Find keys matching a pattern with tenant isolation
   */
  async keys(pattern: string): Promise<string[]> {
    return redisClient.keys(this.prefixKey(pattern));
  }

  /**
   * Set expiration time on a key with tenant isolation
   */
  async expire(key: string, seconds: number): Promise<number> {
    return redisClient.expire(this.prefixKey(key), seconds);
  }

  /**
   * Delete keys matching a pattern with tenant isolation
   */
  async deletePattern(pattern: string): Promise<number> {
    const keys = await redisClient.keys(this.prefixKey(pattern));
    if (keys.length > 0) {
      return redisClient.del(keys);
    }
    return 0;
  }

  /**
   * Cache GraphQL query results with tenant isolation
   */
  async cacheGraphQL(
    operationName: string,
    variables: any,
    result: any,
    ttlSeconds: number
  ): Promise<void> {
    const key = this.generateGraphQLKey(operationName, variables);
    await this.set(key, JSON.stringify(result), ttlSeconds);
  }

  /**
   * Get cached GraphQL query results
   */
  async getCachedGraphQL<T>(
    operationName: string,
    variables: any
  ): Promise<T | null> {
    const key = this.generateGraphQLKey(operationName, variables);
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Generate a unique key for GraphQL queries with tenant isolation
   */
  private generateGraphQLKey(operationName: string, variables: any): string {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(`${operationName}:${JSON.stringify(variables)}`)
      .digest('hex');
    return `graphql:${operationName}:${hash}`;
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
