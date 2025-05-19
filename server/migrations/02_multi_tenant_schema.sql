-- Migration: Create Multi-tenant Tables
-- This migration sets up the core tables for multi-tenant architecture

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  tax_id VARCHAR(255),
  logo VARCHAR(255),
  settings JSONB NOT NULL DEFAULT '{}',
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
  max_users INTEGER NOT NULL DEFAULT 5,
  max_storage INTEGER NOT NULL DEFAULT 1024,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index on tenant slug for quick lookups
CREATE INDEX idx_tenant_slug ON tenants(slug);

-- Inventory Types Table
CREATE TABLE inventory_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  default_fields JSONB NOT NULL DEFAULT '{}',
  default_tabs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tenant Inventory Types Mapping Table
CREATE TABLE tenant_inventory_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_type_id UUID NOT NULL REFERENCES inventory_types(id) ON DELETE CASCADE,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  enabled_features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (tenant_id, inventory_type_id)
);

-- Create index for quick lookups of tenant inventory types
CREATE INDEX idx_tenant_inventory_types_tenant ON tenant_inventory_types(tenant_id);

-- Insert default inventory types
INSERT INTO inventory_types (name, default_fields, default_tabs) VALUES
  ('E-Commerce', 
   '{"sku": {"type": "string", "required": true}, "price": {"type": "number", "required": true}, "stock": {"type": "number", "required": true}}',
   '{"details": {"label": "Product Details"}, "inventory": {"label": "Inventory"}, "pricing": {"label": "Pricing & Variants"}}'
  ),
  ('Restaurant', 
   '{"ingredients": {"type": "array", "required": true}, "allergens": {"type": "array"}, "preparation_time": {"type": "number"}}',
   '{"details": {"label": "Dish Details"}, "ingredients": {"label": "Ingredients"}, "nutrition": {"label": "Nutrition"}}'
  ),
  ('Library', 
   '{"isbn": {"type": "string", "required": true}, "author": {"type": "string", "required": true}, "publisher": {"type": "string"}}',
   '{"details": {"label": "Book Details"}, "borrowing": {"label": "Borrowing History"}, "condition": {"label": "Condition"}}'
  );

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply the trigger to all tables that have updated_at
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_inventory_types_updated_at
BEFORE UPDATE ON inventory_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tenant_inventory_types_updated_at
BEFORE UPDATE ON tenant_inventory_types
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create row-level security policy function
CREATE OR REPLACE FUNCTION tenant_isolation_policy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- We don't want to enforce tenant_id on non-tenant tables
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = TG_TABLE_NAME::text 
      AND column_name = 'tenant_id'
    ) THEN
      IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id cannot be null in tenant-aware tables';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Note: This policy would typically be applied to all tenant-specific tables
