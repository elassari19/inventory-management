import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.date(),
  subscription: z
    .object({
      plan: z.string(),
      status: z.string(),
      endDate: z.date().optional(),
    })
    .optional(),
});

// User Schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  firstName: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters long' })
    .max(50, { message: 'Name must be at most 50 characters long' }),
  lastName: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters long' })
    .max(50, { message: 'Name must be at most 50 characters long' }),
});

export const UserLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string(),
});

// Device Schemas
export const DeviceRegistrationSchema = z.object({
  deviceName: z
    .string()
    .min(3, { message: 'Device name must be at least 3 characters long' }),
});

export const DeviceAuthenticateSchema = z.object({
  deviceId: z.string().uuid({ message: 'Invalid Device ID format' }),
  deviceToken: z.string(),
});

// Enhanced user registration schema
export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.record(z.any()).optional(),
  language: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  roles: z.array(z.string()).optional(),
});

// Enhanced login schema
export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceInfo: z
    .object({
      deviceId: z.string(),
      deviceName: z.string(),
      deviceModel: z.string(),
      platform: z.string(),
      osVersion: z.string(),
      appVersion: z.string(),
    })
    .optional(),
});

// Device schemas
export const DeviceLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceId: z.string(),
});

export const DeviceRegisterSchemaEnhanced = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  deviceModel: z.string(),
  platform: z.string(),
  osVersion: z.string(),
  appVersion: z.string(),
});

// Password reset schemas
export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const PasswordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

// Email verification schema
export const EmailVerificationSchema = z.object({
  token: z.string(),
});

// Two-factor authentication schemas
export const TwoFactorVerifySchema = z.object({
  token: z.string(),
});

export const TwoFactorLoginSchema = z.object({
  userId: z.string().uuid(),
  temporaryToken: z.string(),
  twoFactorCode: z.string(),
});

// Tenant schema
export const TenantSwitchSchema = z.object({
  tenantId: z.string().uuid(),
});

// Offline and biometric authentication schemas
export const OfflineTokenSchema = z.object({
  deviceId: z.string().uuid(),
  tenantId: z.string().uuid(),
  expiryHours: z.number().optional(),
});

export const BiometricAuthSchema = z.object({
  deviceId: z.string().uuid(),
  biometricSignature: z.string(),
  tenantId: z.string().uuid().optional(),
});

// Secure credentials schema
export const SecureCredentialsSchema = z.object({
  deviceId: z.string().uuid(),
  encryptedCredentials: z.string(),
  encryptionMetadata: z.record(z.any()),
});

// Export types for all schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type EnhancedRegisterInput = z.infer<typeof authRegisterSchema>;
export type EnhancedLoginInput = z.infer<typeof authLoginSchema>;
export type DeviceLoginInput = z.infer<typeof DeviceLoginSchema>;
export type DeviceRegisterInput = z.infer<typeof DeviceRegisterSchemaEnhanced>;
export type PasswordResetRequestInput = z.infer<
  typeof PasswordResetRequestSchema
>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
export type TwoFactorVerifyInput = z.infer<typeof TwoFactorVerifySchema>;
export type TwoFactorLoginInput = z.infer<typeof TwoFactorLoginSchema>;
export type TenantSwitchInput = z.infer<typeof TenantSwitchSchema>;
export type OfflineTokenInput = z.infer<typeof OfflineTokenSchema>;
export type BiometricAuthInput = z.infer<typeof BiometricAuthSchema>;
export type SecureCredentialsInput = z.infer<typeof SecureCredentialsSchema>;
