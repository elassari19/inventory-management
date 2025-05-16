import { repositories } from '../db/repositories';
import pool from '../db/pool';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
  /**
   * Record a stock receipt (increase inventory)
   */
  static async stockReceipt(
    tenantId: string,
    productId: string,
    quantity: number,
    locationId: string,
    notes?: string,
    performedBy?: string,
    deviceId?: string
  ) {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify product belongs to the tenant
      const product = await repositories.products.findById(productId, tenantId);
      if (!product) {
        throw new Error('Product not found or does not belong to the tenant');
      }

      // Verify location belongs to the tenant
      const location = await repositories.locations.findById(
        locationId,
        tenantId
      );
      if (!location) {
        throw new Error('Location not found or does not belong to the tenant');
      }

      // Create inventory transaction
      const transactionData = {
        id: uuidv4(),
        transaction_type: 'STOCK_RECEIPT',
        quantity,
        product_id: productId,
        destination_location_id: locationId,
        performed_by: performedBy,
        device_id: deviceId,
        tenant_id: tenantId,
        notes,
        created_at: new Date(),
      };

      const transaction = await client.query(
        `INSERT INTO inventory_transactions 
         (id, transaction_type, quantity, product_id, destination_location_id, performed_by, device_id, tenant_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          transactionData.id,
          transactionData.transaction_type,
          transactionData.quantity,
          transactionData.product_id,
          transactionData.destination_location_id,
          transactionData.performed_by,
          transactionData.device_id,
          transactionData.tenant_id,
          transactionData.notes,
          transactionData.created_at,
        ]
      );

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
        [quantity, productId, tenantId]
      );

      // Create audit record
      const auditData = {
        id: uuidv4(),
        transaction_id: transactionData.id,
        device_id: deviceId,
        user_id: performedBy,
        action_type: 'STOCK_RECEIPT',
        metadata: JSON.stringify({
          quantity,
          location: locationId,
          previousQuantity: product.quantity,
        }),
        created_at: new Date(),
      };

      await client.query(
        `INSERT INTO audit_records 
         (id, transaction_id, device_id, user_id, action_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          auditData.id,
          auditData.transaction_id,
          auditData.device_id,
          auditData.user_id,
          auditData.action_type,
          auditData.metadata,
          auditData.created_at,
        ]
      );

      await client.query('COMMIT');

      // Get the updated product
      const updatedProduct = await repositories.products.findById(
        productId,
        tenantId
      );

      return {
        transaction: transaction.rows[0],
        product: updatedProduct,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in stockReceipt:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record a stock adjustment (increase or decrease inventory)
   */
  static async stockAdjustment(
    tenantId: string,
    productId: string,
    quantity: number, // Can be positive (add) or negative (remove)
    locationId: string,
    reason: string,
    performedBy?: string,
    deviceId?: string
  ) {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify product belongs to the tenant
      const product = await repositories.products.findById(productId, tenantId);
      if (!product) {
        throw new Error('Product not found or does not belong to the tenant');
      }

      // Verify location belongs to the tenant
      const location = await repositories.locations.findById(
        locationId,
        tenantId
      );
      if (!location) {
        throw new Error('Location not found or does not belong to the tenant');
      }

      // Check if adjustment would result in negative inventory
      const newQuantity = product.quantity + quantity;
      if (newQuantity < 0) {
        throw new Error('Adjustment would result in negative inventory');
      }

      // Create inventory transaction
      const transactionData = {
        id: uuidv4(),
        transaction_type: 'STOCK_ADJUSTMENT',
        quantity,
        product_id: productId,
        source_location_id: quantity < 0 ? locationId : null,
        destination_location_id: quantity > 0 ? locationId : null,
        performed_by: performedBy,
        device_id: deviceId,
        tenant_id: tenantId,
        notes: reason,
        created_at: new Date(),
      };

      const transaction = await client.query(
        `INSERT INTO inventory_transactions 
         (id, transaction_type, quantity, product_id, source_location_id, destination_location_id, performed_by, device_id, tenant_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          transactionData.id,
          transactionData.transaction_type,
          transactionData.quantity,
          transactionData.product_id,
          transactionData.source_location_id,
          transactionData.destination_location_id,
          transactionData.performed_by,
          transactionData.device_id,
          transactionData.tenant_id,
          transactionData.notes,
          transactionData.created_at,
        ]
      );

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
        [quantity, productId, tenantId]
      );

      // Create audit record
      const auditData = {
        id: uuidv4(),
        transaction_id: transactionData.id,
        device_id: deviceId,
        user_id: performedBy,
        action_type: 'STOCK_ADJUSTMENT',
        metadata: JSON.stringify({
          quantity,
          location: locationId,
          reason,
          previousQuantity: product.quantity,
        }),
        created_at: new Date(),
      };

      await client.query(
        `INSERT INTO audit_records 
         (id, transaction_id, device_id, user_id, action_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          auditData.id,
          auditData.transaction_id,
          auditData.device_id,
          auditData.user_id,
          auditData.action_type,
          auditData.metadata,
          auditData.created_at,
        ]
      );

      await client.query('COMMIT');

      // Get the updated product
      const updatedProduct = await repositories.products.findById(
        productId,
        tenantId
      );

      return {
        transaction: transaction.rows[0],
        product: updatedProduct,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in stockAdjustment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record a stock transfer between locations
   */
  static async transferStock(
    tenantId: string,
    productId: string,
    quantity: number,
    sourceLocationId: string,
    destinationLocationId: string,
    notes?: string,
    performedBy?: string,
    deviceId?: string
  ) {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify product belongs to the tenant
      const product = await repositories.products.findById(productId, tenantId);
      if (!product) {
        throw new Error('Product not found or does not belong to the tenant');
      }

      // Verify source location belongs to the tenant
      const sourceLocation = await repositories.locations.findById(
        sourceLocationId,
        tenantId
      );
      if (!sourceLocation) {
        throw new Error(
          'Source location not found or does not belong to the tenant'
        );
      }

      // Verify destination location belongs to the tenant
      const destinationLocation = await repositories.locations.findById(
        destinationLocationId,
        tenantId
      );
      if (!destinationLocation) {
        throw new Error(
          'Destination location not found or does not belong to the tenant'
        );
      }

      // Create inventory transaction
      const transactionData = {
        id: uuidv4(),
        transaction_type: 'TRANSFER',
        quantity,
        product_id: productId,
        source_location_id: sourceLocationId,
        destination_location_id: destinationLocationId,
        performed_by: performedBy,
        device_id: deviceId,
        tenant_id: tenantId,
        notes,
        created_at: new Date(),
      };

      const transaction = await client.query(
        `INSERT INTO inventory_transactions 
         (id, transaction_type, quantity, product_id, source_location_id, destination_location_id, performed_by, device_id, tenant_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          transactionData.id,
          transactionData.transaction_type,
          transactionData.quantity,
          transactionData.product_id,
          transactionData.source_location_id,
          transactionData.destination_location_id,
          transactionData.performed_by,
          transactionData.device_id,
          transactionData.tenant_id,
          transactionData.notes,
          transactionData.created_at,
        ]
      );

      // Create audit record
      const auditData = {
        id: uuidv4(),
        transaction_id: transactionData.id,
        device_id: deviceId,
        user_id: performedBy,
        action_type: 'TRANSFER',
        metadata: JSON.stringify({
          quantity,
          sourceLocation: sourceLocationId,
          destinationLocation: destinationLocationId,
        }),
        created_at: new Date(),
      };

      await client.query(
        `INSERT INTO audit_records 
         (id, transaction_id, device_id, user_id, action_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          auditData.id,
          auditData.transaction_id,
          auditData.device_id,
          auditData.user_id,
          auditData.action_type,
          auditData.metadata,
          auditData.created_at,
        ]
      );

      await client.query('COMMIT');

      return {
        transaction: transaction.rows[0],
        product,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in transferStock:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record a sale (decrease inventory)
   */
  static async recordSale(
    tenantId: string,
    productId: string,
    quantity: number,
    locationId: string,
    performedBy?: string,
    deviceId?: string
  ) {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify product belongs to the tenant
      const product = await repositories.products.findById(productId, tenantId);
      if (!product) {
        throw new Error('Product not found or does not belong to the tenant');
      }

      // Verify location belongs to the tenant
      const location = await repositories.locations.findById(
        locationId,
        tenantId
      );
      if (!location) {
        throw new Error('Location not found or does not belong to the tenant');
      }

      // Check if there's enough inventory
      if (product.quantity < quantity) {
        throw new Error('Not enough inventory to complete sale');
      }

      // Create inventory transaction
      const transactionData = {
        id: uuidv4(),
        transaction_type: 'SALE',
        quantity: -quantity, // Negative for outgoing inventory
        product_id: productId,
        source_location_id: locationId,
        performed_by: performedBy,
        device_id: deviceId,
        tenant_id: tenantId,
        created_at: new Date(),
      };

      const transaction = await client.query(
        `INSERT INTO inventory_transactions 
         (id, transaction_type, quantity, product_id, source_location_id, performed_by, device_id, tenant_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          transactionData.id,
          transactionData.transaction_type,
          transactionData.quantity,
          transactionData.product_id,
          transactionData.source_location_id,
          transactionData.performed_by,
          transactionData.device_id,
          transactionData.tenant_id,
          transactionData.created_at,
        ]
      );

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
        [quantity, productId, tenantId]
      );

      // Create audit record
      const auditData = {
        id: uuidv4(),
        transaction_id: transactionData.id,
        device_id: deviceId,
        user_id: performedBy,
        action_type: 'SALE',
        metadata: JSON.stringify({
          quantity,
          location: locationId,
          previousQuantity: product.quantity,
        }),
        created_at: new Date(),
      };

      await client.query(
        `INSERT INTO audit_records 
         (id, transaction_id, device_id, user_id, action_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          auditData.id,
          auditData.transaction_id,
          auditData.device_id,
          auditData.user_id,
          auditData.action_type,
          auditData.metadata,
          auditData.created_at,
        ]
      );

      await client.query('COMMIT');

      // Get the updated product
      const updatedProduct = await repositories.products.findById(
        productId,
        tenantId
      );

      return {
        transaction: transaction.rows[0],
        product: updatedProduct,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in recordSale:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Scan a product barcode and record inventory transaction
   */
  static async scanProductBarcode(
    tenantId: string,
    barcode: string,
    quantity: number,
    transactionType: string,
    locationId: string,
    notes?: string,
    performedBy?: string,
    deviceId?: string
  ) {
    // Find product by barcode
    const product = await repositories.products.findByBarcode(
      barcode,
      tenantId
    );

    if (!product) {
      throw new Error('Product not found with the given barcode');
    }

    // Process transaction based on type
    switch (transactionType) {
      case 'STOCK_RECEIPT':
        return this.stockReceipt(
          tenantId,
          product.id,
          quantity,
          locationId,
          notes,
          performedBy,
          deviceId
        );

      case 'STOCK_ADJUSTMENT':
        return this.stockAdjustment(
          tenantId,
          product.id,
          quantity,
          locationId,
          notes || 'Adjusted via barcode scan',
          performedBy,
          deviceId
        );

      case 'SALE':
        return this.recordSale(
          tenantId,
          product.id,
          quantity,
          locationId,
          performedBy,
          deviceId
        );

      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }
  }

  /**
   * Get products with stock levels below reorder point
   */
  static async getProductsBelowReorderPoint(tenantId: string) {
    try {
      const query = `
        SELECT * FROM products
        WHERE tenant_id = $1 AND reorder_point IS NOT NULL AND quantity <= reorder_point
        ORDER BY (quantity::float / NULLIF(reorder_point, 0)::float) ASC
      `;

      const result = await pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getProductsBelowReorderPoint:', error);
      throw error;
    }
  }

  /**
   * Get inventory value report
   */
  static async getInventoryValueReport(tenantId: string) {
    try {
      // Get total inventory value
      const totalValueQuery = `
        SELECT SUM(quantity * cost) as total_value, COUNT(*) as total_products
        FROM products
        WHERE tenant_id = $1 AND cost IS NOT NULL
      `;

      const totalValueResult = await pool.query(totalValueQuery, [tenantId]);

      // Get value by category
      const categoryValueQuery = `
        SELECT c.id as category_id, c.name as category_name, 
               SUM(p.quantity * p.cost) as value, COUNT(p.id) as product_count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.tenant_id = $1 AND p.cost IS NOT NULL
        GROUP BY c.id, c.name
        ORDER BY value DESC
      `;

      const categoryValueResult = await pool.query(categoryValueQuery, [
        tenantId,
      ]);

      return {
        totalValue: totalValueResult.rows[0]?.total_value || 0,
        totalProducts: parseInt(totalValueResult.rows[0]?.total_products) || 0,
        valueByCategory: categoryValueResult.rows,
        tenantId,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getInventoryValueReport:', error);
      throw error;
    }
  }

  /**
   * Get transaction summary report
   */
  static async getTransactionSummary(
    tenantId: string,
    startDate: string,
    endDate: string,
    groupBy: string = 'transaction_type'
  ) {
    try {
      let groupByClause: string;
      let selectClause: string;

      // Determine grouping
      switch (groupBy) {
        case 'daily':
          groupByClause = "DATE_TRUNC('day', created_at)";
          selectClause =
            "TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as label";
          break;

        case 'weekly':
          groupByClause = "DATE_TRUNC('week', created_at)";
          selectClause =
            "TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as label";
          break;

        case 'monthly':
          groupByClause = "DATE_TRUNC('month', created_at)";
          selectClause =
            "TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as label";
          break;

        case 'product':
          groupByClause = 'product_id';
          selectClause = 'p.name as label, transaction_type';
          break;

        case 'location':
          groupByClause =
            'COALESCE(source_location_id, destination_location_id)';
          selectClause = 'l.name as label, transaction_type';
          break;

        default: // transaction_type
          groupByClause = 'transaction_type';
          selectClause = 'transaction_type as label';
          break;
      }

      let query = `
        SELECT ${selectClause}, COUNT(*) as count, SUM(ABS(quantity)) as total_quantity
      `;

      // Add joins if needed
      if (groupBy === 'product') {
        query += `
          FROM inventory_transactions it
          JOIN products p ON it.product_id = p.id
        `;
      } else if (groupBy === 'location') {
        query += `
          FROM inventory_transactions it
          JOIN locations l ON COALESCE(it.source_location_id, it.destination_location_id) = l.id
        `;
      } else {
        query += `
          FROM inventory_transactions it
        `;
      }

      // Add where clause
      query += `
        WHERE it.tenant_id = $1
        AND it.created_at BETWEEN $2 AND $3
      `;

      // Add group by
      query += `
        GROUP BY ${groupByClause}
      `;

      if (groupBy === 'product' || groupBy === 'location') {
        query += ', transaction_type';
      }

      // Add order by
      query += `
        ORDER BY count DESC
      `;

      const result = await pool.query(query, [tenantId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error in getTransactionSummary:', error);
      throw error;
    }
  }
}
