import { InventoryRepository } from './inventory.repository';
import { InventoryItem, StockMovement } from './inventory.model';

export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  private getItemCacheKey(tenantId: string, itemId: string): string {
    return `inventory:${tenantId}:item:${itemId}`;
  }

  async createItem(
    tenantId: string,
    itemData: Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> {
    const item = await this.repository.createItem({
      ...itemData,
      tenantId,
    });

    return item;
  }

  async updateItem(
    tenantId: string,
    itemId: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    const item = await this.repository.updateItem(itemId, {
      ...updates,
      tenantId,
    });

    return item;
  }

  async getItem(
    tenantId: string,
    itemId: string
  ): Promise<InventoryItem | null> {
    // If not in cache, get from database
    const item = await this.repository.getItemById(itemId, tenantId);

    return item;
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
    return this.repository.listItems(tenantId, filters);
  }

  async adjustStock(
    tenantId: string,
    movement: Omit<StockMovement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<StockMovement> {
    const item = await this.getItem(tenantId, movement.itemId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    switch (movement.type) {
      case 'IN':
        newQuantity += movement.quantity;
        break;
      case 'OUT':
        if (item.quantity < movement.quantity) {
          throw new Error('Insufficient stock');
        }
        newQuantity -= movement.quantity;
        break;
      case 'ADJUST':
        newQuantity = movement.quantity;
        break;
    }

    // Update item quantity
    await this.updateItem(tenantId, movement.itemId, { quantity: newQuantity });

    // Record the movement
    return this.repository.recordStockMovement({
      ...movement,
      tenantId,
    });
  }
}
