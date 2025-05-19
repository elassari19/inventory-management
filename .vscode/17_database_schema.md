# Database Schema

## Overview

Comprehensive database schema design for the multi-tenant inventory management system.

## PostgreSQL Schema

### Authentication and Users

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logo_url VARCHAR(512),
  settings JSONB,
  tax_id VARCHAR(100),
  subscription_id UUID,
  tier VARCHAR(50)
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  address JSONB,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE user_tenants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR(50) NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);
```

### Inventory Management

```sql
CREATE TABLE inventory_types (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(255),
  default_fields JSONB,
  default_tabs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_inventory_types (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  inventory_type_id UUID REFERENCES inventory_types(id),
  custom_fields JSONB,
  enabled_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, inventory_type_id)
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  inventory_type_id UUID REFERENCES inventory_types(id),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  description TEXT,
  category VARCHAR(100),
  tags TEXT[],
  attributes JSONB,
  custom_fields JSONB,
  images TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE locations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  parent_id UUID REFERENCES locations(id),
  address JSONB,
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  item_id UUID REFERENCES inventory_items(id),
  location_id UUID REFERENCES locations(id),
  quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(15,2),
  max_quantity DECIMAL(15,2),
  unit_cost DECIMAL(15,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, item_id, location_id)
);
```

### Purchase Orders and Suppliers

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  tax_id VARCHAR(100),
  payment_terms VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  po_number VARCHAR(100) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status VARCHAR(50) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(15,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id),
  item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  received_quantity DECIMAL(15,2) DEFAULT 0,
  notes TEXT
);
```

### Sales and Customers

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  order_number VARCHAR(100) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(15,2),
  notes TEXT,
  shipping_address JSONB,
  shipping_method VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),
  item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  fulfilled_quantity DECIMAL(15,2) DEFAULT 0,
  location_id UUID REFERENCES locations(id),
  notes TEXT
);
```

### Audit Logging

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT,
  changes JSONB,
  metadata JSONB
);
```

## Index Strategy

```sql
-- Tenant isolation indexes
CREATE INDEX idx_inventory_items_tenant_id ON inventory_items(tenant_id);
CREATE INDEX idx_stock_tenant_id ON stock(tenant_id);
CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_sales_orders_tenant_id ON sales_orders(tenant_id);

-- Common queries
CREATE INDEX idx_inventory_items_sku ON inventory_items(tenant_id, sku);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(tenant_id, barcode);
CREATE INDEX idx_stock_item_location ON stock(tenant_id, item_id, location_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(tenant_id, status);
CREATE INDEX idx_sales_orders_status ON sales_orders(tenant_id, status);
```

## Redis Cache Structure

- `tenant:{tenant_id}:settings` - Tenant configuration
- `tenant:{tenant_id}:item:{item_id}` - Item details
- `tenant:{tenant_id}:stock:{location_id}:{item_id}` - Stock levels
- `tenant:{tenant_id}:orders:recent` - Recent orders list
