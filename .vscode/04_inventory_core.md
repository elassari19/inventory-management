# Inventory Management Core

## Overview

Core inventory management functionality for tracking items, stock levels, and locations.

## Features

- Multiple inventory types support (e-commerce, restaurant, library, etc.)
- Custom fields per inventory type
- Item categorization
- Stock level tracking
- Location management
- Barcode/QR code scanning
- Batch operations

## Technical Implementation

- PostgreSQL for inventory data with tenant isolation
- Redis caching for frequently accessed inventory data
- Materialized views for inventory aggregates
- Real-time updates with optimistic UI

## Data Models

```
InventoryItem {
  id: UUID
  tenantId: UUID
  inventoryTypeId: UUID
  name: String
  sku: String
  barcode: String
  description: Text
  category: String
  tags: String[]
  attributes: JSON
  customFields: JSON
  images: String[]
  active: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: UUID
}

Stock {
  id: UUID
  tenantId: UUID
  itemId: UUID (ref: InventoryItem.id)
  locationId: UUID (ref: Location.id)
  quantity: Decimal
  minQuantity: Decimal
  maxQuantity: Decimal
  unitCost: Decimal
  updatedAt: DateTime
}

Location {
  id: UUID
  tenantId: UUID
  name: String
  type: Enum(WAREHOUSE, STORE, SHELF, BIN)
  parentId: UUID (ref: Location.id)
  address: String
  attributes: JSON
}
```

## API Endpoints

- GET /api/inventory/items
- POST /api/inventory/items
- GET /api/inventory/items/:id
- PUT /api/inventory/items/:id
- DELETE /api/inventory/items/:id
- GET /api/inventory/stock
- POST /api/inventory/stock/adjust
- GET /api/inventory/locations
