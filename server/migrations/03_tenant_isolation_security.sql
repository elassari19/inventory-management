-- Migration: Implement tenant isolation security measures
-- This migration adds row-level security policies for multi-tenant tables

-- Enable row-level security on all tenant-specific tables
-- First, let's create an RLS policy for inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_type_id UUID NOT NULL REFERENCES inventory_types(id),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable row-level security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for the tenant_isolation_trigger function
CREATE TRIGGER enforce_tenant_id_on_insert
BEFORE INSERT ON inventory_items
FOR EACH ROW EXECUTE FUNCTION tenant_isolation_policy();

-- Policy for SELECT operations - users can only view rows from their tenant
CREATE POLICY tenant_isolation_select_policy ON inventory_items
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy for INSERT operations - force tenant_id to match current tenant
CREATE POLICY tenant_isolation_insert_policy ON inventory_items
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy for UPDATE operations - can only update rows from their tenant
CREATE POLICY tenant_isolation_update_policy ON inventory_items
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy for DELETE operations - can only delete rows from their tenant
CREATE POLICY tenant_isolation_delete_policy ON inventory_items
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create the same policies for tenant_inventory_types table
ALTER TABLE tenant_inventory_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select_policy ON tenant_inventory_types
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_insert_policy ON tenant_inventory_types
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_update_policy ON tenant_inventory_types
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_delete_policy ON tenant_inventory_types
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create a function to set the tenant ID in the current session
CREATE OR REPLACE FUNCTION set_tenant_id(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Set the tenant ID for the current session
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Grant usage permissions to the appropriate role
-- Replace 'app_role' with the actual role your application uses
-- GRANT EXECUTE ON FUNCTION set_tenant_id(UUID) TO app_role;

-- Add an index on tenant_id for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id ON inventory_items(tenant_id);
