
-- Add IP and location tracking to auth_logs table
ALTER TABLE IF EXISTS auth_logs
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS location_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS location_region VARCHAR(50),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10) DEFAULT 'low';

-- Create index on auth_logs for faster IP-based queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);

-- Create index on auth_logs for risk level
CREATE INDEX IF NOT EXISTS idx_auth_logs_risk_level ON auth_logs(risk_level);

-- Create IP block table to track blocked IPs
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address VARCHAR(45) NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on ip_blocks for faster lookup
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip_address ON ip_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_expires_at ON ip_blocks(expires_at);

-- Create stored procedure to clean up expired IP blocks
CREATE OR REPLACE FUNCTION cleanup_expired_ip_blocks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM ip_blocks WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired IP blocks
DROP TRIGGER IF EXISTS trg_cleanup_expired_ip_blocks ON ip_blocks;
CREATE TRIGGER trg_cleanup_expired_ip_blocks
AFTER INSERT ON ip_blocks
EXECUTE FUNCTION cleanup_expired_ip_blocks();
