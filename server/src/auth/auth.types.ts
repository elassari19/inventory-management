export interface JwtPayload {
  sub: string; // user ID
  email: string;
  tenant_id?: string;
  device_id?: string;
  exp?: number;
  iat?: number;
  type?: string; // 'access' or 'refresh'
  roles?: string[];
  permissions?: string[];
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  platform: string;
  osVersion: string;
  appVersion: string;
}

export interface SecurityTrackingService {
  trackRegistration(userId: string): Promise<void>;
  trackLoginAttempt(
    userId: string,
    success: boolean,
    ip: string
  ): Promise<void>;
  trackPasswordReset(userId: string): Promise<void>;
  trackLogout(userId: string): Promise<void>;
  trackDeviceRegistration(userId: string, deviceId: string): Promise<void>;
}

export interface DeviceAuthService {
  authenticateDevice(userId: string, deviceInfo: DeviceInfo): Promise<string>;
  validateDeviceToken(token: string): Promise<boolean>;
  revokeDevice(userId: string, deviceId: string): Promise<void>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  currentTenantId?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthenticatedDevice {
  id: string;
  deviceId: string;
  userId: string;
  tenantId?: string;
  name?: string;
  model?: string;
  platform?: string;
}

export interface TenantRole {
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DeviceLoginCredentials {
  email: string;
  password: string;
  deviceId: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Record<string, any>;
  language?: string;
  tenantId?: string;
  roles?: string[];
}

export interface UserWithTenants {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  tenants: Array<any>;
  [key: string]: any;
}

export interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  platform: string;
  osVersion: string;
  appVersion: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
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

// Security tracking types
export interface SuspiciousLoginData {
  id?: string;
  userId: string;
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  userAgent: string;
  timestamp: string;
  riskLevel: 'medium' | 'high';
  reasons: string[];
}

export interface SecurityAssessment {
  isSuspicious: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface IPBlockData {
  ipAddress: string;
  reason: string;
  blockedAt: string;
  duration?: number;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
