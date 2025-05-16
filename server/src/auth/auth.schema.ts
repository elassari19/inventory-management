import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
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
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters long' })
    .max(50, { message: 'Name must be at most 50 characters long' }),
});

export const UserLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string(),
});

// Tenant Schemas
export const SelectTenantSchema = z.object({
  tenantId: z.string().uuid({ message: 'Invalid Tenant ID format' }),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
