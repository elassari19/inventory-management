# Multi-tenancy Management

## Overview

Core system for managing multiple tenants with isolated data but shared services.

## Features

- Tenant creation and management
- Tenant-specific configuration
- Tenant data isolation
- Resource allocation and limits
- Tenant branding and customization

## Technical Implementation

- Tenant identification via subdomain, header, or token claim
- Database schema with tenant_id on all tables
- Query middleware to enforce tenant isolation
- Tenant-specific caching with namespaced Redis keys

## Data Models

```
Tenant {
  id: UUID
  name: String
  slug: String (unique)
  active: Boolean
  createdAt: DateTime
  taxId: String
  logo: String (URL)
  settings: JSON
  contactEmail: String
  contactPhone: String
  tier: Enum(FREE, BASIC, PREMIUM, ENTERPRISE)
  maxUsers: Integer
  maxStorage: Integer
}

TenantInventoryType {
  id: UUID
  tenantId: UUID (ref: Tenant.id)
  inventoryTypeId: UUID (ref: InventoryType.id)
  customFields: JSON
  enabledFeatures: JSON
}

InventoryType {
  id: UUID
  name: String
  icon: String
  defaultFields: JSON
  defaultTabs: JSON
}
```

## Tenant Isolation Strategy

- Row-level security in PostgreSQL
- Tenant ID in all database queries
- Tenant-specific Redis cache namespaces
- Tenant context in API requests
