-- Create inventory tables with tenant isolation
CREATE TABLE inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER,
    max_quantity INTEGER,
    unit_price DECIMAL(15,2) NOT NULL,
    location VARCHAR(255),
    barcode VARCHAR(255),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, sku)
);

CREATE TABLE inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory_categories(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE TABLE stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(tenant_id, sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(tenant_id, category_id);
CREATE INDEX idx_inventory_categories_tenant ON inventory_categories(tenant_id);
CREATE INDEX idx_stock_movements_tenant_item ON stock_movements(tenant_id, item_id);

-- Row level security for tenant isolation
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_tenant_isolation ON inventory_items
    FOR ALL
    TO authenticated
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY inventory_categories_tenant_isolation ON inventory_categories
    FOR ALL
    TO authenticated
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY stock_movements_tenant_isolation ON stock_movements
    FOR ALL
    TO authenticated
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_categories_updated_at
    BEFORE UPDATE ON inventory_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
