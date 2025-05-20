-- Authentication System Migration
-- This migration adds tables required for the authentication system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id, role)
);

-- Create user_devices table for device management
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_model VARCHAR(255),
  platform VARCHAR(50),
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_authorized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Create device_sessions table for device authentication
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_reset_tokens table for password reset functionality
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create two_factor_auth table for 2FA
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,
  backup_codes JSONB,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create auth_logs table for security logging
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  device_id VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_tenant_id ON device_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_tenant_id ON auth_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
