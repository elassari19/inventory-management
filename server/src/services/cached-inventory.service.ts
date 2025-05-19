/**
 * Cached Inventory Service
 * Demonstrates how to use the cache service with tenant isolation
 */

import { getTenantCache, CacheType } from './cache.service';
import { TenantRedisService } from '../utils/redis.utils';

// Type definitions for inventory items
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: string;
  description?: string;
  price: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CachedInventoryService {
  private tenantId: string;
  private cache: ReturnType<typeof getTenantCache>;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.cache = getTenantCache(tenantId);
  }

  /**
   * Get inventory item with caching
   */
  async getItem(itemId: string): Promise<InventoryItem | null> {
    const cacheKey = `inventory:item:${itemId}`;

    // Use getOrSet pattern for automatic cache handling
    return this.cache.getOrSet<InventoryItem | null>(
      cacheKey,
      async () => {
        // This function only runs on cache miss
        // In a real app, this would query the database
        console.log('Cache miss for item', itemId);

        // Simulate database query
        // In a real app, this would be a database call
        const item = await this.fetchItemFromDatabase(itemId);
        return item;
      },
      CacheType.STANDARD // 30 min cache
    );
  }

  /**
   * Get inventory items by category with caching
   */
  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    const cacheKey = `inventory:category:${category}`;

    return this.cache.getOrSet<InventoryItem[]>(
      cacheKey,
      async () => {
        // This function only runs on cache miss
        console.log('Cache miss for category', category);

        // Simulate database query
        // In a real app, this would be a database call
        const items = await this.fetchItemsByCategoryFromDatabase(category);
        return items;
      },
      CacheType.STANDARD // 30 min cache
    );
  }

  /**
   * Update inventory item with cache invalidation
   */
  async updateItem(
    itemId: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    try {
      // In a real app, this would update the database
      const updatedItem = await this.updateItemInDatabase(itemId, updates);

      if (updatedItem) {
        // Invalidate single item cache
        await this.cache.invalidate(`inventory:item:${itemId}`);

        // Invalidate category caches that might contain this item
        await this.cache.invalidate(
          `inventory:category:${updatedItem.category}`
        );

        // If category was changed, invalidate old category cache too
        if (updates.category && updates.category !== updatedItem.category) {
          await this.cache.invalidate(`inventory:category:${updates.category}`);
        }
      }

      return updatedItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item with cache invalidation
   */
  async deleteItem(itemId: string): Promise<boolean> {
    try {
      // Get item details first to know which caches to invalidate
      const item = await this.getItem(itemId);

      if (!item) {
        return false;
      }

      // In a real app, this would delete from the database
      const success = await this.deleteItemFromDatabase(itemId);

      if (success) {
        // Invalidate single item cache
        await this.cache.invalidate(`inventory:item:${itemId}`);

        // Invalidate category cache
        await this.cache.invalidate(`inventory:category:${item.category}`);
      }

      return success;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Clear all inventory caches for this tenant
   */
  async clearAllCaches(): Promise<boolean> {
    try {
      // Clear all inventory-related caches for this tenant
      await this.cache.invalidatePattern('inventory:*');
      return true;
    } catch (error) {
      console.error('Error clearing inventory caches:', error);
      return false;
    }
  }

  // Simulate database operations for demonstration purposes
  // In a real app, these would interact with your database

  private async fetchItemFromDatabase(
    itemId: string
  ): Promise<InventoryItem | null> {
    // Simulate DB query delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Demo data
    return {
      id: itemId,
      name: `Product ${itemId}`,
      sku: `SKU-${itemId}`,
      quantity: 100,
      category: 'electronics',
      description: 'A sample product',
      price: 99.99,
      tenantId: this.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async fetchItemsByCategoryFromDatabase(
    category: string
  ): Promise<InventoryItem[]> {
    // Simulate DB query delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Demo data
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `item-${i + 1}`,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} Product ${
        i + 1
      }`,
      sku: `SKU-${category}-${i + 1}`,
      quantity: 50 + i * 10,
      category,
      description: `A sample ${category} product`,
      price: 49.99 + i * 10,
      tenantId: this.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  private async updateItemInDatabase(
    itemId: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem | null> {
    // Simulate DB query delay
    await new Promise((resolve) => setTimeout(resolve, 75));

    // Get current item
    const item = await this.fetchItemFromDatabase(itemId);

    if (!item) {
      return null;
    }

    // Apply updates
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };

    return updatedItem;
  }

  private async deleteItemFromDatabase(itemId: string): Promise<boolean> {
    // Simulate DB query delay
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Simulate successful deletion
    return true;
  }
}

/**
 * Create a cached inventory service for a specific tenant
 */
export const getTenantInventoryService = (
  tenantId: string
): CachedInventoryService => {
  return new CachedInventoryService(tenantId);
};
