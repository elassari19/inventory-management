-- Migration: 08_notification_system.sql
-- Description: Create notification system tables for multi-platform notifications

-- Create notifications table to store all notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels JSONB NOT NULL DEFAULT '[]', -- array of enabled channels
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, expired
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_tenant ON notifications(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    quiet_hours JSONB, -- {start: "22:00", end: "08:00"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Primary key
    PRIMARY KEY (user_id, tenant_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_notification_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_prefs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create in-app notifications table for web/mobile app notifications
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_in_app_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_in_app_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for in-app notifications
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_tenant ON in_app_notifications(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_expires_at ON in_app_notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create notification delivery logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
    status VARCHAR(20) NOT NULL, -- success, failed, pending
    error TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_delivery_logs_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Create indexes for delivery logs
CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_channel ON notification_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON notification_delivery_logs(status);

-- Create notification templates table for dynamic templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
    template JSONB NOT NULL,
    tenant_id UUID, -- NULL for system-wide templates
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for type+channel combination per tenant
    UNIQUE(type, channel, tenant_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_notification_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create notification queues table for scheduled/delayed notifications
CREATE TABLE IF NOT EXISTS notification_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_data JSONB NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notification queues
CREATE INDEX IF NOT EXISTS idx_notification_queues_scheduled ON notification_queues(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queues_status ON notification_queues(status);

-- Add push token column to user_devices table for push notifications
ALTER TABLE user_devices 
ADD COLUMN IF NOT EXISTS push_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS push_platform VARCHAR(20); -- 'ios', 'android', 'web'

-- Create index for push tokens
CREATE INDEX IF NOT EXISTS idx_user_devices_push_token ON user_devices(push_token) WHERE push_token IS NOT NULL;

-- Add phone column to users table for SMS notifications
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verification_sent TIMESTAMP WITH TIME ZONE;

-- Create notification categories table for organizing notification types
CREATE TABLE IF NOT EXISTS notification_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    default_channels JSONB DEFAULT '["in_app"]',
    tenant_id UUID, -- NULL for system categories
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_notification_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Insert default notification categories
INSERT INTO notification_categories (name, description, default_channels) VALUES
('inventory', 'Inventory related notifications', '["email", "in_app"]'),
('security', 'Security and authentication alerts', '["email", "sms", "push", "in_app"]'),
('system', 'System status and maintenance', '["email", "in_app"]'),
('reports', 'Report generation and analytics', '["email", "in_app"]'),
('users', 'User management notifications', '["email", "in_app"]')
ON CONFLICT (name) DO NOTHING;

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER update_notification_queues_updated_at
    BEFORE UPDATE ON notification_queues
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired in-app notifications
    DELETE FROM in_app_notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old read in-app notifications (older than 30 days)
    DELETE FROM in_app_notifications 
    WHERE read = TRUE AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Delete old notification logs (older than 90 days)
    DELETE FROM notification_delivery_logs 
    WHERE delivered_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID, p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM in_app_notifications
    WHERE user_id = p_user_id 
      AND tenant_id = p_tenant_id 
      AND read = FALSE
      AND (expires_at IS NULL OR expires_at > NOW());
      
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies for tenant isolation
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications (users can only see their own notifications within their tenant)
CREATE POLICY notifications_tenant_isolation ON notifications
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY in_app_notifications_user_isolation ON in_app_notifications
    FOR ALL USING (
        user_id = current_setting('app.current_user_id')::UUID
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenants 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY notification_preferences_user_isolation ON user_notification_preferences
    FOR ALL USING (
        user_id = current_setting('app.current_user_id')::UUID
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenants 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- Grant necessary permissions
GRANT ALL ON notifications TO ventory_app;
GRANT ALL ON in_app_notifications TO ventory_app;
GRANT ALL ON user_notification_preferences TO ventory_app;
GRANT ALL ON notification_delivery_logs TO ventory_app;
GRANT ALL ON notification_templates TO ventory_app;
GRANT ALL ON notification_queues TO ventory_app;
GRANT ALL ON notification_categories TO ventory_app;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ventory_app;

COMMENT ON TABLE notifications IS 'Stores all notifications sent through the system';
COMMENT ON TABLE in_app_notifications IS 'Stores in-app notifications for web and mobile interfaces';
COMMENT ON TABLE user_notification_preferences IS 'Stores user preferences for notification channels and types';
COMMENT ON TABLE notification_delivery_logs IS 'Logs delivery status for each notification channel';
COMMENT ON TABLE notification_templates IS 'Stores customizable notification templates';
COMMENT ON TABLE notification_queues IS 'Queue for scheduled and delayed notifications';
COMMENT ON TABLE notification_categories IS 'Categories for organizing notification types';
