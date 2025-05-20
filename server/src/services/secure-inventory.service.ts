/**
 * Secure Inventory Service
 * Provides inventory operations with tenant isolation
 */

import { createTenantContext } from '../tenant/tenant-context';
import { TenantRequest } from '../middleware/tenant.middleware';

/**
 * Service for secure inventory operations with tenant isolation
 */
export class SecureInventoryService {
  /**
   * Get inventory items for a tenant with proper isolation
   */
  async getInventoryItems(
    req: TenantRequest,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ) {
    const { limit = 20, offset = 0, search = '' } = options;

    // Create a tenant context to ensure proper isolation
    const tenantContext = createTenantContext(req.tenantId!);

    try {
      // Get the database client from the tenant context
      const db = await tenantContext.getDB();

      // Check cache first
      const redis = tenantContext.getRedis();
      const cacheKey = `inventory:items:${limit}:${offset}:${search}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Build the query with search condition if provided
      let query = `
        SELECT i.*, it.name as inventory_type_name
        FROM inventory_items i
        JOIN inventory_types it ON i.inventory_type_id = it.id
      `;

      const params: any[] = [];

      if (search) {
        query += ` WHERE i.name ILIKE $1 OR i.sku ILIKE $1`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY i.created_at DESC LIMIT $${
        params.length + 1
      } OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      // Execute the query - tenant_id filtering is handled by RLS
      const result = await db.query(query, params);

      // Cache the result for future requests (expire after 5 minutes)
      await redis.set(cacheKey, JSON.stringify(result.rows), 300);

      return result.rows;
    } finally {
      // Always release the tenant context when done
      await tenantContext.release();
    }
  }

  /**
   * Create a new inventory item with tenant isolation
   */
  async createInventoryItem(
    req: TenantRequest,
    itemData: {
      name: string;
      inventoryTypeId: string;
      sku?: string;
      description?: string;
      quantity: number;
      attributes?: Record<string, any>;
    }
  ) {
    const tenantContext = createTenantContext(req.tenantId!);

    try {
      const db = await tenantContext.getDB();

      // Insert the new inventory item
      // No need to specify tenant_id in the query as RLS will handle it
      const query = `
        INSERT INTO inventory_items (
          tenant_id, inventory_type_id, name, sku, description, quantity, attributes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING *
      `;

      const values = [
        req.tenantId, // Still need to provide tenant_id as a parameter
        itemData.inventoryTypeId,
        itemData.name,
        itemData.sku || null,
        itemData.description || null,
        itemData.quantity,
        JSON.stringify(itemData.attributes || {}),
      ];

      const result = await db.query(query, values);

      // Invalidate cache
      const redis = tenantContext.getRedis();
      await redis.del('inventory:items:*');

      return result.rows[0];
    } finally {
      await tenantContext.release();
    }
  }

  /**
   * Update an inventory item with tenant isolation
   */
  async updateInventoryItem(
    req: TenantRequest,
    itemId: string,
    updates: {
      name?: string;
      sku?: string;
      description?: string;
      quantity?: number;
      attributes?: Record<string, any>;
    }
  ) {
    const tenantContext = createTenantContext(req.tenantId!);

    try {
      const db = await tenantContext.getDB();

      // Build the update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [itemId]; // First parameter is the item ID
      let paramIndex = 2;

      // Add each field to be updated
      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }

      if (updates.sku !== undefined) {
        updateFields.push(`sku = $${paramIndex++}`);
        values.push(updates.sku);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.quantity !== undefined) {
        updateFields.push(`quantity = $${paramIndex++}`);
        values.push(updates.quantity);
      }

      if (updates.attributes !== undefined) {
        updateFields.push(`attributes = $${paramIndex++}`);
        values.push(JSON.stringify(updates.attributes));
      }

      // Update the item - RLS will ensure we only update items for this tenant
      const query = `
        UPDATE inventory_items
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, values);

      // Invalidate cache
      const redis = tenantContext.getRedis();
      await redis.del('inventory:items:*');

      // If no rows were updated, the item doesn't exist or doesn't belong to this tenant
      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      await tenantContext.release();
    }
  }

  /**
   * Delete an inventory item with tenant isolation
   */
  async deleteInventoryItem(req: TenantRequest, itemId: string) {
    const tenantContext = createTenantContext(req.tenantId!);

    try {
      const db = await tenantContext.getDB();

      // Delete the item - RLS will ensure we only delete items for this tenant
      const query = `
        DELETE FROM inventory_items
        WHERE id = $1
        RETURNING id
      `;

      const result = await db.query(query, [itemId]);

      // Invalidate cache
      const redis = tenantContext.getRedis();
      await redis.del('inventory:items:*');

      return result.rowCount > 0;
    } finally {
      await tenantContext.release();
    }
  }
}

export const secureInventoryService = new SecureInventoryService();
export default secureInventoryService;
