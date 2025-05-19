/**
 * Tenant Repository
 * Provides data access methods for tenants
 */

import pool from '../db/config';
import {
  Tenant,
  TenantInventoryType,
  InventoryType,
} from '../models/tenant.model';

/**
 * Repository for managing tenant data
 */
export class TenantRepository {
  /**
   * Maps a database row to a Tenant object
   * Converts snake_case database columns to camelCase
   */
  private mapDatabaseRowToTenant(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      taxId: row.tax_id,
      logo: row.logo,
      settings:
        typeof row.settings === 'string'
          ? JSON.parse(row.settings)
          : row.settings,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      tier: row.tier,
      maxUsers: row.max_users,
      maxStorage: row.max_storage,
    };
  }

  /**
   * Find a tenant by its slug (subdomain)
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants
      WHERE slug = $1
    `;

    const result = await pool.query(query, [slug]);

    if (result.rowCount === 0) return null;

    // Convert database column names to camelCase
    const tenant = this.mapDatabaseRowToTenant(result.rows[0]);
    return tenant;
  }

  /**
   * Find a tenant by its ID
   */
  async findById(id: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0 || result.rowCount === null) return null;

    return this.mapDatabaseRowToTenant(result.rows[0]);
  }

  /**
   * Create a new tenant
   */
  async create(tenant: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> {
    const query = `
      INSERT INTO tenants (
        name, slug, active, tax_id, logo, settings, 
        contact_email, contact_phone, tier, max_users, max_storage
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;

    const values = [
      tenant.name,
      tenant.slug,
      tenant.active,
      tenant.taxId || null,
      tenant.logo || null,
      JSON.stringify(tenant.settings),
      tenant.contactEmail,
      tenant.contactPhone || null,
      tenant.tier,
      tenant.maxUsers,
      tenant.maxStorage,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0 || result.rowCount === null) {
      throw new Error('Failed to create tenant');
    }

    return this.mapDatabaseRowToTenant(result.rows[0]);
  }

  /**
   * Update a tenant
   */
  async update(id: string, tenant: Partial<Tenant>): Promise<Tenant | null> {
    // Build update query dynamically based on provided fields
    const fields = Object.keys(tenant);
    if (fields.length === 0) return this.findById(id);

    // Map fields to their corresponding database column names
    const dbFields = fields.map((field) => {
      switch (field) {
        case 'taxId':
          return 'tax_id';
        case 'contactEmail':
          return 'contact_email';
        case 'contactPhone':
          return 'contact_phone';
        case 'maxUsers':
          return 'max_users';
        case 'maxStorage':
          return 'max_storage';
        default:
          return field;
      }
    });

    // Generate SET clause
    const setClause = dbFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    // Generate query
    const query = `
      UPDATE tenants
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    // Prepare values array
    const values = [id];
    fields.forEach((field) => {
      let value = tenant[field as keyof typeof tenant];
      if (field === 'settings' && value) {
        value = JSON.stringify(value);
      }
      values.push(value as any);
    });

    const result = await pool.query(query, values);

    if (result.rowCount === 0 || result.rowCount === null) return null;

    return this.mapDatabaseRowToTenant(result.rows[0]);
  }

  /**
   * Delete a tenant - Note: This should be used with extreme caution
   * Typically, tenants should be marked inactive instead of being deleted
   */
  async delete(id: string): Promise<boolean> {
    // This operation would typically require cascading deletes or foreign key constraints
    const query = `
      DELETE FROM tenants
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get inventory types associated with a tenant
   */
  async getInventoryTypes(tenantId: string): Promise<TenantInventoryType[]> {
    const query = `
      SELECT * FROM tenant_inventory_types
      WHERE tenant_id = $1
    `;

    const result = await pool.query(query, [tenantId]);

    // Map results to proper types
    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      inventoryTypeId: row.inventory_type_id,
      customFields:
        typeof row.custom_fields === 'string'
          ? JSON.parse(row.custom_fields)
          : row.custom_fields,
      enabledFeatures:
        typeof row.enabled_features === 'string'
          ? JSON.parse(row.enabled_features)
          : row.enabled_features,
    }));
  }
}

/**
 * Repository for managing inventory types
 */
export class InventoryTypeRepository {
  /**
   * Map database row to InventoryType
   */
  private mapDatabaseRowToInventoryType(row: any): InventoryType {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      defaultFields:
        typeof row.default_fields === 'string'
          ? JSON.parse(row.default_fields)
          : row.default_fields,
      defaultTabs:
        typeof row.default_tabs === 'string'
          ? JSON.parse(row.default_tabs)
          : row.default_tabs,
    };
  }

  /**
   * Get all inventory types
   */
  async findAll(): Promise<InventoryType[]> {
    const query = `
      SELECT * FROM inventory_types
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => this.mapDatabaseRowToInventoryType(row));
  }

  /**
   * Find an inventory type by its ID
   */
  async findById(id: string): Promise<InventoryType | null> {
    const query = `
      SELECT * FROM inventory_types
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0 || result.rowCount === null) return null;

    return this.mapDatabaseRowToInventoryType(result.rows[0]);
  }

  /**
   * Create a tenant-inventory type association
   */
  async associateWithTenant(
    tenantId: string,
    inventoryTypeId: string,
    customFields: Record<string, any> = {},
    enabledFeatures: Record<string, boolean> = {}
  ): Promise<TenantInventoryType> {
    const query = `
      INSERT INTO tenant_inventory_types (
        tenant_id, inventory_type_id, custom_fields, enabled_features
      ) VALUES (
        $1, $2, $3, $4
      )
      RETURNING *
    `;

    const values = [
      tenantId,
      inventoryTypeId,
      JSON.stringify(customFields),
      JSON.stringify(enabledFeatures),
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0 || result.rowCount === null) {
      throw new Error('Failed to associate inventory type with tenant');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      inventoryTypeId: row.inventory_type_id,
      customFields:
        typeof row.custom_fields === 'string'
          ? JSON.parse(row.custom_fields)
          : row.custom_fields,
      enabledFeatures:
        typeof row.enabled_features === 'string'
          ? JSON.parse(row.enabled_features)
          : row.enabled_features,
    };
  }
}

export const tenantRepository = new TenantRepository();
export const inventoryTypeRepository = new InventoryTypeRepository();
