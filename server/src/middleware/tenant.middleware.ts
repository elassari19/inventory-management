/**
 * Tenant Middleware
 * Extracts tenant information from request and adds it to the context
 */

import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '../repositories/tenant.repository';

export interface AuthUser {
  id: string;
  tenantId?: string;
  roles?: string[];
  [key: string]: any;
}

export interface TenantRequest {
  tenant?: {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, any>;
    active: boolean;
    tier: string;
  };
  user?: AuthUser;
}

/**
 * Extract tenant information from various sources:
 * 1. Subdomain
 * 2. Custom header
 * 3. JWT token claim
 */
export const extractTenant = async (
  req: Request & TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Method 1: Extract from subdomain
    const host = req.headers.host || '';
    const subdomainMatch = host.match(/^([^.]+)\.ventory\.app$/);

    if (
      subdomainMatch &&
      subdomainMatch[1] !== 'www' &&
      subdomainMatch[1] !== 'api'
    ) {
      req.tenant!.id = subdomainMatch[1];
    }

    // If no tenant ID was found, this might be a public endpoint or an error
    if (!req.tenant!.id) {
      // Check if this is a public endpoint (authentication, signup, etc.)
      const isPublicEndpoint =
        req.path.startsWith('/api/auth/') ||
        req.path === '/api/health' ||
        req.path === '/api/tenants/register';

      if (!isPublicEndpoint) {
        return res.status(400).json({ error: 'Missing tenant information' });
      }
    } else {
      try {
        // Import tenant repository when needed to avoid circular dependencies
        const {
          tenantRepository,
        } = require('../repositories/tenant.repository');

        // Try to find tenant by ID first (assuming ID was passed)
        let tenant = null;
        if (
          req.tenant!.id.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          // If it looks like a UUID, try to find by ID
          tenant = await tenantRepository.findById(req.tenant!.id);
        }

        // If not found or not a UUID, try by slug
        if (!tenant) {
          tenant = await tenantRepository.findBySlug(req.tenant!.id);
        }

        if (tenant) {
          req.tenant = tenant;
        } else {
          // Tenant ID was specified but not found
          return res.status(404).json({ error: 'Tenant not found' });
        }
      } catch (error) {
        console.error('Error loading tenant data:', error);
        return res.status(500).json({ error: 'Error loading tenant data' });
      }
    }

    next();
  } catch (error) {
    console.error('Error extracting tenant information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Ensure tenant is active and valid
 * This middleware should be used after extractTenant
 */
export const requireTenant = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.tenant!.id) {
    return res
      .status(400)
      .json({ error: 'Tenant information is required for this endpoint' });
  }

  if (req.tenant && req.tenant.active == false) {
    return res.status(403).json({ error: 'This tenant account is inactive' });
  }

  next();
};

export default { extractTenant, requireTenant };
