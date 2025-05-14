import { Request, Response, NextFunction } from 'express';

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
      createdAt: Date;
      subscription?: {
        plan: string;
        status: string;
        endDate?: Date;
      };
    }
  }
}
