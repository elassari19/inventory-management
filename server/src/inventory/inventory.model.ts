import { Request } from 'express';

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  unitPrice: number;
  location?: string;
  barcode?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryRequest extends Request {
  tenant: {
    id: string;
    name: string;
  };
}
