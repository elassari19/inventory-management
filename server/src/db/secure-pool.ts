/**
 * Secure Database Pool with Tenant Isolation
 * Provides database connection pool with row-level security for tenant isolation
 */

import { Pool, PoolClient } from 'pg';
import pool from './config';

/**
 * Secure database client that sets the tenant context for row-level security
 */
export class SecureTenantClient {
  private client: PoolClient;
  private tenantId: string;
  private sessionInitialized: boolean = false;

  constructor(client: PoolClient, tenantId: string) {
    this.client = client;
    this.tenantId = tenantId;
  }

  /**
   * Execute a query with tenant isolation using PostgreSQL row-level security
   */
  async query(text: string, params: any[] = []): Promise<any> {
    // Initialize the session with tenant context if not already done
    if (!this.sessionInitialized) {
      await this.initializeTenantSession();
    }

    // Execute the query (RLS will now be applied automatically by PostgreSQL)
    return this.client.query(text, params);
  }

  /**
   * Initialize the PostgreSQL session with tenant context for RLS
   */
  private async initializeTenantSession(): Promise<void> {
    // Set the tenant context for the database session using the function we created
    await this.client.query('SELECT set_tenant_id($1)', [this.tenantId]);
    this.sessionInitialized = true;
  }

  /**
   * Release the client back to the pool
   */
  async release(): Promise<void> {
    // Reset the tenant context before releasing the client
    try {
      await this.client.query('RESET app.current_tenant_id');
    } catch (error) {
      console.error('Error resetting tenant context:', error);
    }
    return this.client.release();
  }
}

/**
 * Get a secure database client with tenant isolation
 */
export const getSecureTenantDB = async (
  tenantId: string
): Promise<SecureTenantClient> => {
  if (!tenantId) {
    throw new Error(
      'Tenant ID is required to get a secure tenant database client'
    );
  }

  const client = await pool.connect();
  return new SecureTenantClient(client, tenantId);
};

export default { getSecureTenantDB };
