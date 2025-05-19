/**
 * Tenant Models
 * Database models for multi-tenant architecture
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
  taxId?: string;
  logo?: string;
  settings: Record<string, any>;
  contactEmail: string;
  contactPhone?: string;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  maxUsers: number;
  maxStorage: number;
}

export interface TenantInventoryType {
  id: string;
  tenantId: string;
  inventoryTypeId: string;
  customFields: Record<string, any>;
  enabledFeatures: Record<string, boolean>;
}

export interface InventoryType {
  id: string;
  name: string;
  icon?: string;
  defaultFields: Record<string, any>;
  defaultTabs: Record<string, any>;
}
