-- Mobile Authentication System Migration
-- This migration adds columns required for mobile authentication features

-- Add biometric authentication support to user_devices table
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;

-- Add secure credential storage to user_devices table
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS secure_credentials TEXT;
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS encryption_metadata JSONB;

-- Create offline_tokens table for tracking offline token issuance
CREATE TABLE IF NOT EXISTS offline_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_identifier TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(device_id, tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offline_tokens_device_tenant ON offline_tokens(device_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_offline_tokens_user ON offline_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_tokens_expiry ON offline_tokens(expires_at);

-- Add index for biometric authentication
CREATE INDEX IF NOT EXISTS idx_user_devices_biometric ON user_devices(user_id, biometric_enabled);
