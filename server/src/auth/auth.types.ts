export interface JwtPayload {
  userId: string;
  tenantId?: string;
  deviceId?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string; // Or username, depending on your setup
  currentTenantId?: string;
}

export interface AuthenticatedDevice {
  id: string;
  tenantId: string;
  name?: string; // Optional: a friendly name for the device
}

// Example type for a user object that might be stored in the database
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  // other user fields
}

// Example type for a device object
export interface Device {
  id: string;
  tenantId: string;
  name?: string;
  // other device-specific fields, e.g., lastSeen, status
}

// Example type for a tenant object
export interface Tenant {
  id: string;
  name: string;
  // other tenant-specific fields
}

// Example type for the association between a user and a tenant
export interface TenantUser {
  userId: string;
  tenantId: string;
  roles: string[]; // e.g., ['admin', 'scanner']
}
