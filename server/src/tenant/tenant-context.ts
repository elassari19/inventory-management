/**
 * Database Tenant Context Service
 * Manages database connection with tenant context
 */

import { getSecureTenantDB, SecureTenantClient } from '../db/secure-pool';
import {
  getTenantRedisService,
  TenantRedisService,
} from '../utils/redis.utils';

/**
 * TenantContext provides access to tenant-specific database and redis clients
 * This ensures proper isolation between tenants at the database and cache level
 */
export class TenantContext {
  private tenantId: string;
  private _db: SecureTenantClient | null = null;
  private _redis: TenantRedisService | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get a secure database client for the tenant
   */
  async getDB(): Promise<SecureTenantClient> {
    if (!this._db) {
      this._db = await getSecureTenantDB(this.tenantId);
    }
    return this._db;
  }

  /**
   * Get a tenant-specific Redis client
   */
  getRedis(): TenantRedisService {
    if (!this._redis) {
      this._redis = getTenantRedisService(this.tenantId);
    }
    return this._redis;
  }

  /**
   * Release all resources when done
   */
  async release(): Promise<void> {
    if (this._db) {
      await this._db.release();
      this._db = null;
    }
  }
}

/**
 * Create a tenant context for database and cache operations
 */
export const createTenantContext = (tenantId: string): TenantContext => {
  return new TenantContext(tenantId);
};

export default { createTenantContext };
