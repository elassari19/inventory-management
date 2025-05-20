/**
 * Tenant Switching Service
 * Handles tenant switching functionality for multi-tenant authentication
 */

import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { JWT_SECRET } from '../auth/auth.constants';
import { JwtPayload } from '../auth/auth.types';

export class TenantSwitchingService {
  /**
   * Switch the active tenant for a user
   * This creates a new JWT token with the selected tenant context
   */
  async switchTenant(
    userId: string,
    tenantId: string
  ): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // Verify user has access to this tenant
    const tenantAccessResult = await pool.query(
      `SELECT t.*, ur.role, ur.permissions
       FROM tenants t
       JOIN user_roles ur ON t.id = ur.tenant_id
       WHERE ur.user_id = $1 AND t.id = $2`,
      [userId, tenantId]
    );

    if (tenantAccessResult.rows.length === 0) {
      throw new Error('User does not have access to this tenant');
    }

    const tenantAccess = tenantAccessResult.rows[0];

    // Create JWT payload with tenant context
    const payload: JwtPayload = {
      userId,
      tenantId,
      roles: [tenantAccess.role],
      type: 'access',
    };

    // Add permissions if available
    if (tenantAccess.permissions) {
      payload.permissions = Array.isArray(tenantAccess.permissions)
        ? tenantAccess.permissions
        : [];
    }

    // Calculate expiry time (1 hour by default)
    const expiresIn = 60 * 60;

    // Generate access token
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h',
    });

    // Log tenant switch
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, tenant_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [userId, 'TENANT_SWITCH', tenantId, 'SUCCESS']
    );

    return {
      accessToken,
      expiresIn,
    };
  }

  /**
   * Get available tenants for a user
   */
  async getUserTenants(userId: string) {
    const tenantsResult = await pool.query(
      `SELECT 
         t.*,
         ur.role,
         ur.permissions,
         (SELECT COUNT(*) FROM auth_logs 
          WHERE user_id = $1 AND tenant_id = t.id AND action = 'TENANT_SWITCH') 
          as switch_count
       FROM tenants t
       JOIN user_roles ur ON t.id = ur.tenant_id
       WHERE ur.user_id = $1
       ORDER BY switch_count DESC`,
      [userId]
    );

    return tenantsResult.rows;
  }

  /**
   * Create a user-tenant association
   */
  async addUserToTenant(userId: string, tenantId: string, role: string) {
    await pool.query(
      `INSERT INTO user_roles (id, user_id, tenant_id, role, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW())
       ON CONFLICT (user_id, tenant_id) 
       DO UPDATE SET role = $3, updated_at = NOW()`,
      [userId, tenantId, role]
    );
  }

  /**
   * Remove a user-tenant association
   */
  async removeUserFromTenant(userId: string, tenantId: string) {
    await pool.query(
      `DELETE FROM user_roles
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
  }

  /**
   * Check if user has access to a specific tenant
   */
  async userHasTenantAccess(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT COUNT(*) > 0 as has_access
       FROM user_roles
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    return result.rows[0]?.has_access || false;
  }
}

// Create and export service instance
export const tenantSwitchingService = new TenantSwitchingService();
