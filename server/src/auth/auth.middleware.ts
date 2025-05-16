import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthenticatedUser, AuthenticatedDevice } from './auth.types';

// Basic web session authentication
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

export const isNotAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.status(403).json({ message: 'Already authenticated' });
};

// JWT-based API authentication for users
export const requireUserAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || 'Unauthorized' });
      }

      req.user = user;
      return next();
    }
  )(req, res, next);
};

// JWT-based API authentication for devices
export const requireDeviceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'device-jwt',
    { session: false },
    (err: any, device: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!device) {
        return res
          .status(401)
          .json({ message: info?.message || 'Device unauthorized' });
      }

      req.device = device;
      return next();
    }
  )(req, res, next);
};

// Multi-tenant specific middleware
export const requireTenantMembership = (requiredRole?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get tenantId from a) JWT context (req.user.currentTenantId) or b) URL param
    const tenantId = req.user?.currentTenantId || req.params.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context missing' });
    }

    // If the user doesn't have currentTenantId set (which is added by JWT strategy),
    // it means they weren't authenticated for this tenant
    if (!req.user?.currentTenantId) {
      return res.status(403).json({ message: 'Not a member of this tenant' });
    }

    // If a specific role is required, check if the user has it
    if (
      requiredRole &&
      (!req.user.roles || !req.user.roles.includes(requiredRole))
    ) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Custom types for Express session
declare module 'express-session' {
  interface SessionData {
    passport: {
      user: string;
    };
  }
}

// Custom types for Express Request
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string;
      createdAt?: Date;
      created_at?: Date;
      currentTenantId?: string;
      roles?: string[];
      subscription?: {
        plan: string;
        status: string;
        endDate?: Date;
      };
    }

    interface Request {
      device?: {
        id: string;
        tenant_id: string;
        name?: string;
      };
    }
  }
}
