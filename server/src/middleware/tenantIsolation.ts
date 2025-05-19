/**
 * Tenant Isolation Middleware
 * Enforces data isolation between tenants at the database query level
 */

import { Pool, PoolClient } from 'pg';
import pool from '../db/config';
import { TenantRequest } from './tenant.middleware';

/**
 * Custom database client wrapper that enforces tenant isolation
 * Automatically adds tenant_id to all queries
 */
export class TenantIsolatedClient {
  private client: PoolClient;
  private tenantId: string;
  
  constructor(client: PoolClient, tenantId: string) {
    this.client = client;
    this.tenantId = tenantId;
  }
  
  /**
   * Execute a query with automatic tenant isolation
   * Injects tenant_id parameter to WHERE clauses
   */
  async query(text: string, params: any[] = []): Promise<any> {
    // Only modify data manipulation queries (SELECT, INSERT, UPDATE, DELETE)
    const isDataQuery = /^(SELECT|INSERT|UPDATE|DELETE)/i.test(text.trim());
    
    if (isDataQuery) {
      // For INSERT queries, ensure tenant_id is included
      if (/^INSERT/i.test(text.trim()) && !text.includes('tenant_id')) {
        // This is a simplified approach - in a real implementation,
        // you'd want to use a SQL parser to handle this more robustly
        const insertMatch = text.match(/^INSERT INTO\s+([^\s(]+)\s*\(([^)]+)\)/i);
        
        if (insertMatch) {
          const table = insertMatch[1];
          const columns = insertMatch[2];
          const newText = `INSERT INTO ${table} (${columns}, tenant_id) VALUES (`;
          text = text.replace(/^INSERT INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*\(/i, newText);
          text = text.replace(/\)$/, `, $${params.length + 1})`);
          params.push(this.tenantId);
        }
      }
      
      // For SELECT, UPDATE, DELETE queries, add tenant_id condition if not present
      else if (!text.includes('tenant_id')) {
        // Add WHERE tenant_id = $n clause or AND tenant_id = $n if WHERE already exists
        if (text.includes('WHERE')) {
          text = text.replace(/WHERE/i, `WHERE tenant_id = $${params.length + 1} AND`);
        } else {
          // Look for a pattern after which we can add WHERE
          const matches = text.match(/(FROM\s+[^\s;]+)/i);
          if (matches) {
            text = text.replace(matches[0], `${matches[0]} WHERE tenant_id = $${params.length + 1}`);
          }
        }
        
        params.push(this.tenantId);
      }
    }
    
    // Execute the modified query
    return this.client.query(text, params);
  }
  
  // Proxy other methods to the underlying client
  async release(): Promise<void> {
    return this.client.release();
  }
}

/**
 * Get a tenant-isolated database client
 * This ensures that all queries are automatically scoped to the current tenant
 */
export const getTenantDB = async (req: TenantRequest): Promise<TenantIsolatedClient> => {
  if (!req.tenantId) {
    throw new Error('Tenant ID is required to get a tenant database client');
  }
  
  const client = await pool.connect();
  return new TenantIsolatedClient(client, req.tenantId);
};

export default { getTenantDB };
