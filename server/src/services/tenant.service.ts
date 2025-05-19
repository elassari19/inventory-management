/**
 * Tenant Service
 * Business logic for tenant management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  tenantRepository,
  inventoryTypeRepository,
} from '../repositories/tenant.repository';
import { Tenant, TenantInventoryType } from '../models/tenant.model';

export class TenantService {
  /**
   * Register a new tenant
   */
  async registerTenant(tenantData: {
    name: string;
    slug: string;
    contactEmail: string;
    contactPhone?: string;
    tier?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    inventoryTypes?: string[];
  }): Promise<Tenant> {
    // Normalize the slug (lowercase, no spaces)
    const slug = tenantData.slug.toLowerCase().replace(/\s+/g, '-');

    // Check if slug is already taken
    const existingTenant = await tenantRepository.findBySlug(slug);
    if (existingTenant) {
      throw new Error(`Tenant with slug "${slug}" already exists`);
    }

    // Set default tier if not provided
    const tier = tenantData.tier || 'FREE';

    // Set tier-specific limits
    let maxUsers = 5;
    let maxStorage = 1024; // 1GB in MB

    switch (tier) {
      case 'BASIC':
        maxUsers = 10;
        maxStorage = 5 * 1024; // 5GB
        break;
      case 'PREMIUM':
        maxUsers = 25;
        maxStorage = 25 * 1024; // 25GB
        break;
      case 'ENTERPRISE':
        maxUsers = 100;
        maxStorage = 100 * 1024; // 100GB
        break;
    }

    // Create the tenant
    const newTenant = await tenantRepository.create({
      name: tenantData.name,
      slug,
      active: true,
      contactEmail: tenantData.contactEmail,
      contactPhone: tenantData.contactPhone,
      tier,
      maxUsers,
      maxStorage,
      settings: {
        theme: 'default',
        languages: ['en'],
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        customizations: {},
      },
    });

    // Associate inventory types if provided
    if (tenantData.inventoryTypes && tenantData.inventoryTypes.length > 0) {
      for (const typeId of tenantData.inventoryTypes) {
        // Verify that the inventory type exists
        const inventoryType = await inventoryTypeRepository.findById(typeId);
        if (inventoryType) {
          await inventoryTypeRepository.associateWithTenant(
            newTenant.id,
            typeId,
            {}, // Default custom fields
            {} // Default enabled features
          );
        }
      }
    }

    return newTenant;
  }

  /**
   * Get tenant information by ID
   */
  async getTenantById(id: string): Promise<Tenant | null> {
    return tenantRepository.findById(id);
  }

  /**
   * Get tenant information by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return tenantRepository.findBySlug(slug);
  }

  /**
   * Update tenant information
   */
  async updateTenant(
    id: string,
    tenantData: Partial<Tenant>
  ): Promise<Tenant | null> {
    // If slug is being updated, validate it
    if (tenantData.slug) {
      const normalizedSlug = tenantData.slug.toLowerCase().replace(/\s+/g, '-');

      // Check if the new slug is already taken by another tenant
      const existingTenant = await tenantRepository.findBySlug(normalizedSlug);
      if (existingTenant && existingTenant.id !== id) {
        throw new Error(`Tenant with slug "${normalizedSlug}" already exists`);
      }

      // Update the slug to the normalized version
      tenantData.slug = normalizedSlug;
    }

    return tenantRepository.update(id, tenantData);
  }

  /**
   * Get all inventory types associated with a tenant
   */
  async getTenantInventoryTypes(
    tenantId: string
  ): Promise<TenantInventoryType[]> {
    return tenantRepository.getInventoryTypes(tenantId);
  }

  /**
   * Add an inventory type to a tenant
   */
  async addInventoryTypeToTenant(
    tenantId: string,
    inventoryTypeId: string,
    customFields: Record<string, any> = {},
    enabledFeatures: Record<string, boolean> = {}
  ): Promise<TenantInventoryType> {
    // Verify that the tenant exists
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID "${tenantId}" not found`);
    }

    // Verify that the inventory type exists
    const inventoryType = await inventoryTypeRepository.findById(
      inventoryTypeId
    );
    if (!inventoryType) {
      throw new Error(`Inventory type with ID "${inventoryTypeId}" not found`);
    }

    // Associate the inventory type with the tenant
    return inventoryTypeRepository.associateWithTenant(
      tenantId,
      inventoryTypeId,
      customFields,
      enabledFeatures
    );
  }
}

export const tenantService = new TenantService();
