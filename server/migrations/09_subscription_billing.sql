-- Migration: 09_subscription_billing.sql
-- Description: Create subscription and billing system tables

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    trial_days INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(name, billing_cycle)
);

-- Create tenant subscriptions table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    payment_method_id UUID,
    external_subscription_id VARCHAR(255), -- Stripe/Payzone subscription ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    
    -- Unique constraint - one active subscription per tenant
    UNIQUE(tenant_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Remove the unique constraint temporarily to allow multiple statuses
ALTER TABLE tenant_subscriptions DROP CONSTRAINT tenant_subscriptions_tenant_id_status_key;

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CARD', 'BANK_ACCOUNT', 'PAYPAL')),
    details JSONB NOT NULL DEFAULT '{}', -- Encrypted payment details
    is_default BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    external_payment_method_id VARCHAR(255), -- Stripe/Payzone payment method ID
    last_four VARCHAR(4),
    brand VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_payment_methods_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL,
    subscription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'PAID', 'FAILED', 'VOID', 'REFUNDED')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    items JSONB NOT NULL DEFAULT '[]',
    billing_details JSONB NOT NULL DEFAULT '{}',
    external_invoice_id VARCHAR(255), -- Stripe/Payzone invoice ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED')),
    payment_method VARCHAR(50),
    gateway_provider VARCHAR(50) NOT NULL DEFAULT 'STRIPE', -- 'STRIPE', 'PAYZONE'
    gateway_transaction_id VARCHAR(255),
    gateway_reference VARCHAR(255),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_payment_transactions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_transactions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Create subscription usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    subscription_id UUID NOT NULL,
    usage_type VARCHAR(50) NOT NULL, -- 'API_CALLS', 'STORAGE', 'USERS', 'LOCATIONS', 'PRODUCTS'
    usage_count INTEGER NOT NULL DEFAULT 0,
    usage_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_subscription_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_usage_subscription FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
    
    -- Unique constraint for usage tracking
    UNIQUE(tenant_id, subscription_id, usage_type, usage_period_start)
);

-- Create billing addresses table
CREATE TABLE IF NOT EXISTS billing_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_billing_addresses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan_id ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(tenant_id, is_default);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_tenant_id ON subscription_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(usage_period_start, usage_period_end);
CREATE INDEX IF NOT EXISTS idx_billing_addresses_tenant_id ON billing_addresses(tenant_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, limits) VALUES
(
    'Free',
    'Free tier with basic features and limited inventory items',
    0.00,
    'MONTHLY',
    '{"inventory_management": true, "basic_reporting": true, "email_support": true}',
    '{"max_products": 100, "max_locations": 1, "max_users": 2, "api_calls_per_month": 1000, "storage_gb": 1}'
),
(
    'Basic',
    'Standard features with moderate limits for small businesses',
    29.99,
    'MONTHLY',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "email_support": true, "barcode_scanning": true}',
    '{"max_products": 1000, "max_locations": 3, "max_users": 5, "api_calls_per_month": 10000, "storage_gb": 10}'
),
(
    'Premium',
    'Advanced features with higher limits for growing businesses',
    79.99,
    'MONTHLY',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "priority_support": true, "barcode_scanning": true, "api_access": true, "custom_integrations": true}',
    '{"max_products": 10000, "max_locations": 10, "max_users": 15, "api_calls_per_month": 100000, "storage_gb": 100}'
),
(
    'Enterprise',
    'Full feature set with customized limits for large organizations',
    199.99,
    'MONTHLY',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "priority_support": true, "barcode_scanning": true, "api_access": true, "custom_integrations": true, "sso": true, "custom_branding": true, "dedicated_support": true}',
    '{"max_products": -1, "max_locations": -1, "max_users": -1, "api_calls_per_month": -1, "storage_gb": -1}'
);

-- Add annual billing plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, limits) VALUES
(
    'Basic',
    'Standard features with moderate limits for small businesses (Annual)',
    299.99,
    'ANNUAL',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "email_support": true, "barcode_scanning": true}',
    '{"max_products": 1000, "max_locations": 3, "max_users": 5, "api_calls_per_month": 10000, "storage_gb": 10}'
),
(
    'Premium',
    'Advanced features with higher limits for growing businesses (Annual)',
    799.99,
    'ANNUAL',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "priority_support": true, "barcode_scanning": true, "api_access": true, "custom_integrations": true}',
    '{"max_products": 10000, "max_locations": 10, "max_users": 15, "api_calls_per_month": 100000, "storage_gb": 100}'
),
(
    'Enterprise',
    'Full feature set with customized limits for large organizations (Annual)',
    1999.99,
    'ANNUAL',
    '{"inventory_management": true, "advanced_reporting": true, "multi_location": true, "priority_support": true, "barcode_scanning": true, "api_access": true, "custom_integrations": true, "sso": true, "custom_branding": true, "dedicated_support": true}',
    '{"max_products": -1, "max_locations": -1, "max_users": -1, "api_calls_per_month": -1, "storage_gb": -1}'
);

-- Add billing update triggers
CREATE OR REPLACE FUNCTION update_billing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_timestamp
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_tenant_subscriptions_timestamp
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_payment_methods_timestamp
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_invoices_timestamp
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_payment_transactions_timestamp
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_subscription_usage_timestamp
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

CREATE TRIGGER update_billing_addresses_timestamp
    BEFORE UPDATE ON billing_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_timestamp();

-- Enable row-level security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY tenant_subscriptions_isolation ON tenant_subscriptions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY payment_methods_isolation ON payment_methods
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY invoices_isolation ON invoices
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY payment_transactions_isolation ON payment_transactions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY subscription_usage_isolation ON subscription_usage
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY billing_addresses_isolation ON billing_addresses
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- Subscription plans are public (read-only for all users)
CREATE POLICY subscription_plans_public ON subscription_plans
    FOR SELECT USING (true);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    invoice_year TEXT;
    invoice_sequence INT;
    invoice_number TEXT;
BEGIN
    invoice_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INT)), 0) + 1
    INTO invoice_sequence
    FROM invoices
    WHERE invoice_number LIKE invoice_year || '-%';
    
    invoice_number := invoice_year || '-' || LPAD(invoice_sequence::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
    p_tenant_id UUID,
    p_limit_type VARCHAR(50),
    p_current_usage INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Get the current subscription limit
    SELECT COALESCE((sp.limits->p_limit_type)::INTEGER, -1)
    INTO subscription_limit
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON ts.plan_id = sp.id
    WHERE ts.tenant_id = p_tenant_id
    AND ts.status = 'ACTIVE'
    ORDER BY ts.created_at DESC
    LIMIT 1;
    
    -- If no subscription found or unlimited (-1), allow
    IF subscription_limit IS NULL OR subscription_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Get current usage based on limit type
    CASE p_limit_type
        WHEN 'max_products' THEN
            SELECT COUNT(*) INTO current_usage FROM products WHERE tenant_id = p_tenant_id;
        WHEN 'max_locations' THEN
            SELECT COUNT(*) INTO current_usage FROM locations WHERE tenant_id = p_tenant_id;
        WHEN 'max_users' THEN
            SELECT COUNT(*) INTO current_usage FROM tenant_users WHERE tenant_id = p_tenant_id;
        ELSE
            current_usage := p_current_usage;
    END CASE;
    
    RETURN current_usage < subscription_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON subscription_plans TO ventory_app;
GRANT ALL ON tenant_subscriptions TO ventory_app;
GRANT ALL ON payment_methods TO ventory_app;
GRANT ALL ON invoices TO ventory_app;
GRANT ALL ON payment_transactions TO ventory_app;
GRANT ALL ON subscription_usage TO ventory_app;
GRANT ALL ON billing_addresses TO ventory_app;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ventory_app;

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with features and limits';
COMMENT ON TABLE tenant_subscriptions IS 'Tenant subscription records with status and billing periods';
COMMENT ON TABLE payment_methods IS 'Stored payment methods for tenants';
COMMENT ON TABLE invoices IS 'Generated invoices for subscription billing';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records';
COMMENT ON TABLE subscription_usage IS 'Usage tracking for subscription limits';
COMMENT ON TABLE billing_addresses IS 'Billing addresses for tenants';
