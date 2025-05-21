import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  stockMovementSchema,
  listInventoryItemsSchema,
} from './inventory.schema';
import { inventoryController } from './inventory.controller';

const router = Router();

// Create inventory item
router.post(
  '/',
  validate(createInventoryItemSchema),
  inventoryController.createItem.bind(inventoryController)
);

// Update inventory item
router.patch(
  '/:id',
  validate(updateInventoryItemSchema),
  inventoryController.updateItem.bind(inventoryController)
);

// Get inventory item
router.get('/:id', inventoryController.getItem.bind(inventoryController));

// List inventory items
router.get(
  '/',
  validate(listInventoryItemsSchema),
  inventoryController.listItems.bind(inventoryController)
);

// Record stock movement
router.post(
  '/stock-movements',
  validate(stockMovementSchema),
  inventoryController.adjustStock.bind(inventoryController)
);

export default router;
