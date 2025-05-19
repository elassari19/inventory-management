# Sales and Fulfillment

## Overview

Management of sales orders and fulfillment workflows for inventory outbound processes.

## Features

- Sales order creation and management
- Customer management
- Order fulfillment workflows
- Shipping integration
- Partial shipments
- Inventory allocation
- Backorder management
- Returns processing

## Technical Implementation

- State machine for order workflow
- Optimistic inventory allocation
- Async processing for fulfillment tasks
- Real-time updates on order status

## Data Models

```
Customer {
  id: UUID
  tenantId: UUID
  name: String
  email: String
  phone: String
  address: JSON
  notes: Text
  customFields: JSON
  createdAt: DateTime
  updatedAt: DateTime
}

SalesOrder {
  id: UUID
  tenantId: UUID
  orderNumber: String
  customerId: UUID (ref: Customer.id)
  status: Enum(DRAFT, CONFIRMED, PROCESSING, PARTIALLY_FULFILLED, FULFILLED, CANCELED)
  orderDate: DateTime
  totalAmount: Decimal
  notes: Text
  shippingAddress: JSON
  shippingMethod: String
  createdBy: UUID
  createdAt: DateTime
  updatedAt: DateTime
}

SalesOrderItem {
  id: UUID
  salesOrderId: UUID (ref: SalesOrder.id)
  itemId: UUID (ref: InventoryItem.id)
  quantity: Decimal
  unitPrice: Decimal
  fulfilledQuantity: Decimal
  locationId: UUID (ref: Location.id)
  notes: Text
}

Fulfillment {
  id: UUID
  tenantId: UUID
  salesOrderId: UUID (ref: SalesOrder.id)
  status: Enum(PENDING, IN_PROGRESS, COMPLETED, CANCELED)
  fulfillmentDate: DateTime
  trackingNumber: String
  shippingCarrier: String
  notes: Text
  fulfilledBy: UUID
}

FulfillmentItem {
  id: UUID
  fulfillmentId: UUID (ref: Fulfillment.id)
  salesOrderItemId: UUID (ref: SalesOrderItem.id)
  quantity: Decimal
  locationId: UUID (ref: Location.id)
}
```

## API Endpoints

- GET /api/customers
- POST /api/customers
- GET /api/sales-orders
- POST /api/sales-orders
- GET /api/sales-orders/:id
- PUT /api/sales-orders/:id/status
- POST /api/sales-orders/:id/fulfill
