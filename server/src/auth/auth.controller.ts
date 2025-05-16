import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === 'Invalid input data') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        const { password, ...userWithoutPassword } = user;
        if (err) return next(err);
        return res.json({
          user: userWithoutPassword,
          session: req.session,
          message: 'Login successful',
        });
      });
    })(req, res, next);
  }

  static logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        console.log('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          console.log('Session destruction error:', err);
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('session', { path: '/' });
        res.clearCookie('user', { path: '/' });
        res.clearCookie('session.sig', { path: '/' });
        res.clearCookie('user.sig', { path: '/' });

        // Move this line inside the callback to ensure it runs after clearing cookies
        return res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  }

  static async getCurrentUser(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await AuthService.getUserById(req.user.id);
    res.json(user);
  }

  static checkSession(req: Request, res: Response) {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  }
}
