import pool from './pool';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Repository class providing common CRUD operations
 */
class BaseRepository {
  tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Find all records in the table
  async findAll(tenantId?: string, options: any = {}) {
    try {
      const whereClause = tenantId ? 'WHERE tenant_id = $1' : '';
      const params = tenantId ? [tenantId] : [];

      let query = `SELECT * FROM ${this.tableName} ${whereClause}`;

      // Add order by if provided
      if (options.orderBy) {
        query += ` ORDER BY ${options.orderBy}`;
      }

      // Add limit and offset for pagination
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error in findAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find a record by ID
  async findById(id: string, tenantId?: string) {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      let params = [id];

      // Add tenant check for multi-tenancy security
      if (tenantId) {
        query += ' AND tenant_id = $2';
        params.push(tenantId);
      }

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error in findById for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Create a new record
  async create(data: any) {
    try {
      // Generate a UUID if not provided
      if (!data.id) {
        data.id = uuidv4();
      }

      const columns = Object.keys(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update a record by ID
  async update(id: string, data: any, tenantId?: string) {
    try {
      // Don't allow updating the ID
      const { id: _, ...updateData } = data;

      const columns = Object.keys(updateData);
      const placeholders = columns
        .map((col, i) => `${col} = $${i + 2}`)
        .join(', ');
      const values = Object.values(updateData);

      let query = `
        UPDATE ${this.tableName}
        SET ${placeholders}
        WHERE id = $1
      `;

      let params = [id, ...values];

      // Add tenant check for multi-tenancy security
      if (tenantId) {
        query += ' AND tenant_id = $' + (params.length + 1);
        params.push(tenantId);
      }

      query += ' RETURNING *';

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Delete a record by ID
  async delete(id: string, tenantId?: string) {
    try {
      let query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      let params = [id];

      // Add tenant check for multi-tenancy security
      if (tenantId) {
        query += ' AND tenant_id = $2';
        params.push(tenantId);
      }

      query += ' RETURNING *';

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Custom query execution
  async executeQuery(query: string, params: any[] = []) {
    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error executing query in ${this.tableName}:`, error);
      throw error;
    }
  }
}

// Specific repositories for each model
export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }
}

export class TenantRepository extends BaseRepository {
  constructor() {
    super('tenants');
  }

  async findByOwner(ownerId: string) {
    try {
      const query = 'SELECT * FROM tenants WHERE owner_id = $1';
      const result = await pool.query(query, [ownerId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findByOwner:', error);
      throw error;
    }
  }

  async findUserTenants(userId: string) {
    try {
      const query = `
        SELECT t.* FROM tenants t
        LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
        WHERE t.owner_id = $1 OR tu.user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findUserTenants:', error);
      throw error;
    }
  }
}

export class TenantUserRepository extends BaseRepository {
  constructor() {
    super('tenant_users');
  }

  async findByTenantAndUser(tenantId: string, userId: string) {
    try {
      const query =
        'SELECT * FROM tenant_users WHERE tenant_id = $1 AND user_id = $2';
      const result = await pool.query(query, [tenantId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByTenantAndUser:', error);
      throw error;
    }
  }

  async findTenantUsers(tenantId: string) {
    try {
      const query = `
        SELECT tu.*, u.email, u.name FROM tenant_users tu
        JOIN users u ON tu.user_id = u.id
        WHERE tu.tenant_id = $1
      `;
      const result = await pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findTenantUsers:', error);
      throw error;
    }
  }

  async updateLastAccessed(tenantId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE tenant_users 
        SET last_accessed = CURRENT_TIMESTAMP 
        WHERE tenant_id = $1 AND user_id = $2
      `;
      await pool.query(query, [tenantId, userId]);
    } catch (error) {
      console.error('Error in updateLastAccessed:', error);
      throw error;
    }
  }
}

export class DeviceRepository extends BaseRepository {
  constructor() {
    super('devices');
  }

  async findByToken(token: string) {
    try {
      const query = 'SELECT * FROM devices WHERE token = $1';
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByToken:', error);
      throw error;
    }
  }

  async updateLastSeen(id: string) {
    try {
      const query =
        'UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in updateLastSeen:', error);
      throw error;
    }
  }
}

export class ProductRepository extends BaseRepository {
  constructor() {
    super('products');
  }

  async findByBarcode(barcode: string, tenantId: string) {
    try {
      const query =
        'SELECT * FROM products WHERE barcode = $1 AND tenant_id = $2';
      const result = await pool.query(query, [barcode, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByBarcode:', error);
      throw error;
    }
  }

  async findBySku(sku: string, tenantId: string) {
    try {
      const query = 'SELECT * FROM products WHERE sku = $1 AND tenant_id = $2';
      const result = await pool.query(query, [sku, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findBySku:', error);
      throw error;
    }
  }

  async searchProducts(
    tenantId: string,
    searchTerm: string,
    options: any = {}
  ) {
    try {
      let query = `
        SELECT * FROM products
        WHERE tenant_id = $1 AND (
          name ILIKE $2 OR
          description ILIKE $2 OR
          sku ILIKE $2 OR
          barcode ILIKE $2
        )
      `;

      const params = [tenantId, `%${searchTerm}%`];

      // Add category filter
      if (options.categoryId) {
        query += ' AND category_id = $' + (params.length + 1);
        params.push(options.categoryId);
      }

      // Add brand filter
      if (options.brandId) {
        query += ' AND brand_id = $' + (params.length + 1);
        params.push(options.brandId);
      }

      // Add order by if provided
      if (options.orderBy) {
        query += ` ORDER BY ${options.orderBy}`;
      } else {
        query += ' ORDER BY name';
      }

      // Add limit and offset for pagination
      if (options.limit) {
        query += ' LIMIT $' + (params.length + 1);
        params.push(options.limit);

        if (options.offset) {
          query += ' OFFSET $' + (params.length + 1);
          params.push(options.offset);
        }
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in searchProducts:', error);
      throw error;
    }
  }
}

export class InventoryTransactionRepository extends BaseRepository {
  constructor() {
    super('inventory_transactions');
  }

  async findByProduct(productId: string, tenantId: string) {
    try {
      const query = `
        SELECT * FROM inventory_transactions
        WHERE product_id = $1 AND tenant_id = $2
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [productId, tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findByProduct:', error);
      throw error;
    }
  }

  async findByDateRange(tenantId: string, startDate: string, endDate: string) {
    try {
      const query = `
        SELECT * FROM inventory_transactions
        WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [tenantId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error in findByDateRange:', error);
      throw error;
    }
  }
}

// Export all repositories
export { BaseRepository };

// Create repository instances
export const repositories = {
  users: new UserRepository(),
  tenants: new TenantRepository(),
  tenantUsers: new TenantUserRepository(),
  devices: new DeviceRepository(),
  products: new ProductRepository(),
  categories: new BaseRepository('categories'),
  brands: new BaseRepository('brands'),
  locations: new BaseRepository('locations'),
  inventoryTransactions: new InventoryTransactionRepository(),
  auditRecords: new BaseRepository('audit_records'),
};
