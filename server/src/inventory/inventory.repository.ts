import {
  InventoryItem,
  InventoryCategory,
  StockMovement,
} from './inventory.model';
import pool from '../db/pool';

export class InventoryRepository {
  constructor() {}

  async createItem(
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> {
    const query = `
      INSERT INTO inventory_items (
        tenant_id, sku, name, description, category_id, 
        quantity, min_quantity, max_quantity, unit_price, 
        location, barcode, tags, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`;

    try {
      const result = await pool.query(query, [
        item.tenantId,
        item.sku,
        item.name,
        item.description,
        item.categoryId,
        item.quantity,
        item.minQuantity,
        item.maxQuantity,
        item.unitPrice,
        item.location,
        item.barcode,
        item.tags,
        item.metadata,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Failed to create inventory item', error);
    }
  }

  async updateItem(
    id: string,
    item: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    const setClause = Object.keys(item)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE inventory_items 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $${Object.keys(item).length + 2}
      RETURNING *`;

    try {
      const result = await pool.query(query, [
        id,
        ...Object.values(item),
        item.tenantId,
      ]);
      if (result.rowCount === 0) {
        throw new Error('Inventory item not found');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error('Failed to update inventory item', error);
    }
  }

  async getItemById(
    id: string,
    tenantId: string
  ): Promise<InventoryItem | null> {
    const query = `
      SELECT * FROM inventory_items 
      WHERE id = $1 AND tenant_id = $2`;

    try {
      const result = await pool.query(query, [id, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error('Failed to get inventory item', error);
    }
  }

  async listItems(
    tenantId: string,
    filters: {
      categoryId?: string;
      search?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ items: InventoryItem[]; total: number }> {
    let query = `
      SELECT * FROM inventory_items 
      WHERE tenant_id = $1`;
    const params = [tenantId];
    let paramIndex = 2;

    if (filters.categoryId) {
      query += ` AND category_id = $${paramIndex++}`;
      params.push(filters.categoryId);
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.tags?.length) {
      query += ` AND tags && $${paramIndex++}`;
      params.push(...filters.tags);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC`;
    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit + '');
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset + '');
    }

    try {
      const result = await pool.query(query, params);
      return { items: result.rows, total };
    } catch (error) {
      throw new Error('Failed to list inventory items', error);
    }
  }

  async recordStockMovement(
    movement: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StockMovement> {
    const query = `
      INSERT INTO stock_movements (
        tenant_id, item_id, type, quantity, 
        reason, reference_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;

    try {
      const result = await pool.query(query, [
        movement.tenantId,
        movement.itemId,
        movement.type,
        movement.quantity,
        movement.reason,
        movement.referenceId,
        movement.metadata,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Failed to record stock movement', error);
    }
  }
}
