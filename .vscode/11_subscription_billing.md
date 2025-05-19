# Subscription and Billing

## Overview

Subscription management and billing system using Payzone payment gateway.

## Features

- Subscription plans and tiers
- Usage-based billing
- Payment processing
- Invoicing
- Subscription management
- Trial periods
- Payment history
- Plan upgrades/downgrades

## Technical Implementation

- Payzone payment gateway integration
- Secure payment processing
- Recurring billing automation
- Invoice generation
- Subscription lifecycle management

## Data Models

```
SubscriptionPlan {
  id: UUID
  name: String
  description: Text
  price: Decimal
  billingCycle: Enum(MONTHLY, QUARTERLY, ANNUAL)
  features: JSON
  limits: JSON
  active: Boolean
}

Subscription {
  id: UUID
  tenantId: UUID
  planId: UUID (ref: SubscriptionPlan.id)
  status: Enum(TRIAL, ACTIVE, PAST_DUE, CANCELED, EXPIRED)
  startDate: DateTime
  endDate: DateTime
  trialEndDate: DateTime
  currentPeriodStart: DateTime
  currentPeriodEnd: DateTime
  canceledAt: DateTime
  paymentMethodId: String
}

Invoice {
  id: UUID
  tenantId: UUID
  subscriptionId: UUID (ref: Subscription.id)
  amount: Decimal
  status: Enum(DRAFT, PENDING, PAID, FAILED, VOID)
  dueDate: DateTime
  paidDate: DateTime
  invoiceNumber: String
  items: JSON
}

PaymentMethod {
  id: UUID
  tenantId: UUID
  type: Enum(CARD, BANK_ACCOUNT)
  details: JSON (encrypted)
  isDefault: Boolean
  expiryDate: DateTime
}

Transaction {
  id: UUID
  tenantId: UUID
  invoiceId: UUID
  amount: Decimal
  status: Enum(PENDING, SUCCEEDED, FAILED)
  paymentMethod: String
  gatewayReference: String
  createdAt: DateTime
}
```

## Subscription Tiers

- Free Tier: Limited features and inventory items
- Basic Tier: Standard features with moderate limits
- Premium Tier: Advanced features with higher limits
- Enterprise Tier: Full feature set with customized limits

## API Endpoints

- GET /api/subscription
- POST /api/subscription/change-plan
- POST /api/payment-methods
- GET /api/invoices
- GET /api/transactions
