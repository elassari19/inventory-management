/**
 * Tenant-related constants
 */

// Tenant Roles
export const TENANT_ADMIN_ROLE = 'tenant_admin';
export const TENANT_MANAGER_ROLE = 'tenant_manager';
export const TENANT_STAFF_ROLE = 'tenant_staff';
export const TENANT_VIEWER_ROLE = 'tenant_viewer';
export const TENANT_SCANNER_ROLE = 'scanner_device'; // Role for scanning devices

// Default tenant settings
export const DEFAULT_TENANT_SETTINGS = {
  maxUsers: 5,
  maxStorage: 1024 * 1024 * 100, // 100MB
  features: {
    inventory: true,
    reports: true,
    api: false,
    webhooks: false,
  },
  branding: {
    primaryColor: '#1976d2',
    logoUrl: '',
  },
};

// Tenant status
export const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};
