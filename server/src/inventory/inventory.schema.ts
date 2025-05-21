import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0),
  location: z.string().optional(),
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const stockMovementSchema = z.object({
  itemId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.number(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const listInventoryItemsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});
