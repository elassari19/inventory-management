# Purchase Order Management

## Overview

System for creating, managing, and receiving purchase orders from suppliers.

## Features

- Purchase order creation and management
- Supplier management
- Order tracking and status updates
- Receiving workflow
- Partial receipts
- Purchase order approvals
- Purchase history and reporting

## Technical Implementation

- State machine for purchase order workflow
- Async processing for bulk operations
- Webhooks for supplier integrations
- PDF generation for purchase orders

## Data Models

```
Supplier {
  id: UUID
  tenantId: UUID
  name: String
  contactName: String
  email: String
  phone: String
  address: String
  taxId: String
  paymentTerms: String
  notes: Text
  active: Boolean
}

PurchaseOrder {
  id: UUID
  tenantId: UUID
  poNumber: String
  supplierId: UUID (ref: Supplier.id)
  status: Enum(DRAFT, SUBMITTED, APPROVED, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELED)
  orderDate: DateTime
  expectedDate: DateTime
  totalAmount: Decimal
  notes: Text
  createdBy: UUID
  approvedBy: UUID
  createdAt: DateTime
  updatedAt: DateTime
}

PurchaseOrderItem {
  id: UUID
  purchaseOrderId: UUID (ref: PurchaseOrder.id)
  itemId: UUID (ref: InventoryItem.id)
  quantity: Decimal
  unitPrice: Decimal
  receivedQuantity: Decimal
  notes: Text
}

ReceivingRecord {
  id: UUID
  tenantId: UUID
  purchaseOrderId: UUID (ref: PurchaseOrder.id)
  receivedDate: DateTime
  receivedBy: UUID
  notes: Text
}

ReceivingItem {
  id: UUID
  receivingRecordId: UUID (ref: ReceivingRecord.id)
  purchaseOrderItemId: UUID (ref: PurchaseOrderItem.id)
  quantity: Decimal
  locationId: UUID (ref: Location.id)
  notes: Text
}
```

## API Endpoints

- GET /api/suppliers
- POST /api/suppliers
- GET /api/purchase-orders
- POST /api/purchase-orders
- GET /api/purchase-orders/:id
- PUT /api/purchase-orders/:id/status
- POST /api/purchase-orders/:id/receive
