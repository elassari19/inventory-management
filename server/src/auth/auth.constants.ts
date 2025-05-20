// JWT Constants
export const JWT_SECRET =
  process.env.JWT_SECRET || 'your-very-strong-secret-key'; // IMPORTANT: Use environment variable in production
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || '1h'; // e.g., '1h', '7d'

// Device Token Constants (if different from user JWTs)
export const DEVICE_JWT_SECRET =
  process.env.DEVICE_JWT_SECRET || 'your-device-specific-secret-key';
export const DEVICE_JWT_EXPIRATION_TIME =
  process.env.DEVICE_JWT_EXPIRATION_TIME || '30d'; // Devices might have longer-lived tokens

// Refresh token expiry in seconds (30 days)
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60;

// Cookie Names (if using cookies for web sessions)
export const AUTH_COOKIE_NAME = 'auth-token';

// Default Roles
export const DEFAULT_USER_ROLE = 'user';

// Tenant Roles (DEPRECATED: Use from tenant/tenant.constants.ts instead)
export const TENANT_ADMIN_ROLE = 'tenant_admin';
export const TENANT_MANAGER_ROLE = 'tenant_manager';
export const TENANT_STAFF_ROLE = 'tenant_staff';
export const TENANT_VIEWER_ROLE = 'tenant_viewer';
export const TENANT_SCANNER_ROLE = 'scanner_device'; // Role for scanning devices

// Permission types
export const PERMISSIONS = {
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  USER_MANAGE: 'user:manage',
  DEVICE_MANAGE: 'device:manage',
  DEVICE_REVOKE: 'device:revoke',
  SETTINGS_MANAGE: 'settings:manage',
  REPORTS_VIEW: 'reports:view',
};

// Role to permission mappings
export const ROLE_PERMISSIONS = {
  [TENANT_ADMIN_ROLE]: Object.values(PERMISSIONS),
  [TENANT_MANAGER_ROLE]: [
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.DEVICE_REVOKE,
  ],
  [TENANT_STAFF_ROLE]: [
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
  ],
  [TENANT_VIEWER_ROLE]: [PERMISSIONS.INVENTORY_READ, PERMISSIONS.REPORTS_VIEW],
  [TENANT_SCANNER_ROLE]: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
  ],
  [DEFAULT_USER_ROLE]: [PERMISSIONS.INVENTORY_READ],
};

// Other auth-related constants
export const BCRYPT_SALT_ROUNDS = 10;

// Rate limiting
export const AUTH_RATE_LIMIT_MAX = 5; // Max requests per minute
export const AUTH_RATE_LIMIT_WINDOW = 60; // Window in seconds
