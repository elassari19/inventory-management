/**
 * Enhanced Auth Middleware
 * Provides JWT authentication, role-based access control, and device authentication
 */

import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../lib/redis';
import { JWT_SECRET, PERMISSIONS, ROLE_PERMISSIONS } from './auth.constants';
import { JwtPayload, AuthenticatedUser } from './auth.types';
import { TenantRequest } from '../middleware/tenant.middleware';
import pool from '../db/pool';

// Create a proper Request type that extends both Express.Request and AuthRequest
export interface Request extends ExpressRequest {
  user?: AuthenticatedUser;
  deviceId?: string;
  userRoles?: string[];
  userPermissions?: string[];
  refreshToken?: string;
}

// Update AuthRequest to extend TenantRequest and our custom Request
export interface AuthRequest extends TenantRequest, Request {
  user?: AuthenticatedUser;
  deviceId?: string;
  userRoles?: string[];
  userPermissions?: string[];
  refreshToken?: string;
}

/**
 * Middleware to verify JWT token from Authorization header
 * and attach user information to the request
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);

    if (isBlacklisted) {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Cast request to AuthRequest
    const authReq = req as AuthRequest;

    // Attach user information to request
    authReq.user = {
      id: decoded.userId,
      email: '', // Will be populated later if needed
      currentTenantId: decoded.tenantId,
    };

    // Attach device ID to request if present
    if (decoded.deviceId) {
      authReq.deviceId = decoded.deviceId;
    }

    // Store roles and permissions if present
    if (decoded.roles) {
      authReq.userRoles = decoded.roles;
    }

    if (decoded.permissions) {
      authReq.userPermissions = decoded.permissions;
    }

    // Store refresh token for potential token rotation
    authReq.refreshToken = token;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to require tenant selection
 */
export const requireTenantContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.currentTenantId) {
    return res.status(400).json({
      message: 'Tenant selection required',
    });
  }

  next();
};

/**
 * Middleware to check if user has a specific role
 */
export const hasRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRoles || !req.userRoles.includes(role)) {
      return res.status(403).json({
        message: 'Access denied: Insufficient role privileges',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has at least one of the specified roles
 */
export const hasAnyRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (
      !req.userRoles ||
      !roles.some((role) => req.userRoles!.includes(role))
    ) {
      return res.status(403).json({
        message: 'Access denied: Insufficient role privileges',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific permission
 */
export const hasPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // If user has explicit permissions in token, check those
    if (req.userPermissions && req.userPermissions.includes(permission)) {
      return next();
    }

    // If roles are in token, derive permissions from roles
    if (req.userRoles) {
      const derivedPermissions = req.userRoles.flatMap(
        (role) => ROLE_PERMISSIONS[role] || []
      );

      if (derivedPermissions.includes(permission)) {
        return next();
      }
    }

    // If neither explicit permissions nor derived permissions match,
    // fetch from database as last resort
    if (req.user?.id && req.user?.currentTenantId) {
      return checkPermissionInDatabase(
        req.user.id,
        req.user.currentTenantId,
        permission,
        req,
        res,
        next
      );
    }

    return res.status(403).json({
      message: 'Access denied: Insufficient permissions',
    });
  };
};

/**
 * Helper function to check permissions in database
 */
const checkPermissionInDatabase = async (
  userId: string,
  tenantId: string,
  permission: string,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user roles for the tenant
    const rolesResult = await pool.query(
      `SELECT role, permissions FROM user_roles 
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (rolesResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Access denied: No roles for this tenant',
      });
    }

    // Check permissions in each role
    let hasRequiredPermission = false;

    for (const roleRow of rolesResult.rows) {
      // First check explicit permissions stored in the role
      if (
        roleRow.permissions &&
        Array.isArray(roleRow.permissions) &&
        roleRow.permissions.includes(permission)
      ) {
        hasRequiredPermission = true;
        break;
      }

      // Then check derived permissions from the role definition
      const rolePermissions = ROLE_PERMISSIONS[roleRow.role] || [];
      if (rolePermissions.includes(permission)) {
        hasRequiredPermission = true;
        break;
      }
    }

    if (hasRequiredPermission) {
      return next();
    }

    return res.status(403).json({
      message: 'Access denied: Insufficient permissions',
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const hasAllPermissions = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (
      !req.userPermissions ||
      !permissions.every((perm) => req.userPermissions!.includes(perm))
    ) {
      return res.status(403).json({
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const hasAnyPermission = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (
      !req.userPermissions ||
      !permissions.some((perm) => req.userPermissions!.includes(perm))
    ) {
      return res.status(403).json({
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to handle device authentication
 */
export const authenticateDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Must have user authentication first
    if (!req.user?.id) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    // Must have device ID
    if (!req.deviceId) {
      return res.status(401).json({
        message: 'Device authentication required',
      });
    }

    // Verify device is authorized for this user
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices
       WHERE user_id = $1 AND device_id = $2 AND is_authorized = true`,
      [req.user.id, req.deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Device not authorized',
      });
    }

    // Update last used timestamp
    await pool.query(
      `UPDATE user_devices SET last_used = NOW()
       WHERE user_id = $1 AND device_id = $2`,
      [req.user.id, req.deviceId]
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid device authentication',
    });
  }
};

/**
 * Middleware to rate limit authentication attempts
 */
export const authRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;

    if (!ip) {
      return next();
    }

    const key = `auth_rate_limit:${ip}`;

    // Get current count
    const count = await redisClient.get(key);

    if (count && parseInt(count) >= 5) {
      return res.status(429).json({
        message: 'Too many attempts. Please try again later.',
      });
    }

    // Increment count
    await redisClient.incr(key);

    // Set expiry if not already set
    await redisClient.expire(key, 60); // 1 minute

    next();
  } catch (error) {
    // If rate limiting fails, still allow the request to proceed
    next();
  }
};

/**
 * Middleware to require verified email
 */
export const requireVerifiedEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const userResult = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    if (!userResult.rows[0].email_verified) {
      return res.status(403).json({
        message: 'Email verification required',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Log authentication activity for audit purposes
 */
export const logAuthActivity = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalEnd = res.end;

    res.end = function (chunk?: any, encoding?: any, callback?: any) {
      // Cast to AuthRequest if needed
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const tenantId = authReq.user?.currentTenantId;
      const deviceId = authReq.deviceId;
      const status =
        res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';

      try {
        pool.query(
          `INSERT INTO auth_logs (
            id, user_id, action, ip_address, user_agent, device_id, 
            status, tenant_id, metadata
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8
          )`,
          [
            userId || null,
            action,
            req.ip || req.socket.remoteAddress || null,
            req.headers['user-agent'] || null,
            deviceId || null,
            status,
            tenantId || null,
            JSON.stringify({
              path: req.path,
              method: req.method,
              statusCode: res.statusCode,
            }),
          ]
        );
      } catch (error) {
        console.error('Failed to log auth activity:', error);
      }

      return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
  };
};
