/**
 * Tenant Schemas
 * Zod schemas for tenant-related operations
 */

import { z } from 'zod';

export const SelectTenantSchema = z.object({
  tenantId: z.string().uuid({ message: 'Invalid Tenant ID format' }),
});

export const CreateTenantSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Tenant name must be at least 3 characters long' }),
  slug: z
    .string()
    .min(2, { message: 'Tenant slug must be at least 2 characters long' })
    .regex(/^[a-z0-9-]+$/, {
      message:
        'Tenant slug can only contain lowercase letters, numbers, and hyphens',
    }),
  planId: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

export const UpdateTenantSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Tenant name must be at least 3 characters long' })
    .optional(),
  settings: z.record(z.any()).optional(),
  active: z.boolean().optional(),
});

export const TenantUserRoleSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid User ID format' }),
  tenantId: z.string().uuid({ message: 'Invalid Tenant ID format' }),
  role: z.string(),
});
