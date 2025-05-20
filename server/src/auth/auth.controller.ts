/**
 * Authentication Controller
 * Handles all authentication-related routes
 *
 * This file merges the functionality from both auth.controller.ts and auth-auth.controller.ts
 * into a single, comprehensive authentication controller.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import session from 'express-session';
import { authService } from './auth.service';
import { emailValidationService } from './email.service';
import { deviceAuthService } from './device-auth.service';
import { twoFactorAuthService } from './two-factor-auth.service';
import { securityTrackingService } from './security-tracking.service';
import { JWT_SECRET } from './auth.constants';
import {
  LoginCredentials,
  RegisterUserData,
  DeviceRegistrationData,
} from './auth.types';

import {
  authRegisterSchema,
  authLoginSchema,
  DeviceLoginSchema,
  TwoFactorLoginSchema,
  PasswordResetSchema,
  PasswordResetRequestSchema,
  EmailVerificationSchema,
  DeviceRegisterSchemaEnhanced,
  TwoFactorVerifySchema,
} from './auth.schema';

export class AuthController {
  /**
   * Legacy register function (session-based)
   *
   * POST /api/auth/register-legacy
   */
  static async registerLegacy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.registerUser(req.body);
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

  /**
   * Legacy login function (session-based)
   *
   * POST /api/auth/login-legacy
   */
  static async loginLegacy(req: Request, res: Response, next: NextFunction) {
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
          message: 'Login successful',
        });
      });
    })(req, res, next);
  }

  /**
   * Legacy logout function (session-based)
   *
   * POST /api/auth/logout-legacy
   */
  static logoutLegacy(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        console.log('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.log('Session destruction error:', err);
            return res
              .status(500)
              .json({ error: 'Session destruction failed' });
          }
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('session', { path: '/' });
          res.clearCookie('user', { path: '/' });
          res.clearCookie('session.sig', { path: '/' });
          res.clearCookie('user.sig', { path: '/' });

          // Move this line inside the callback to ensure it runs after clearing cookies
          return res.status(200).json({ message: 'Logged out successfully' });
        });
      } else {
        return res.status(200).json({ message: 'Logged out successfully' });
      }
    });
  }

  /**
   * Legacy get current user function (session-based)
   *
   * GET /api/auth/current-user-legacy
   */
  static async getCurrentUserLegacy(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Cast to any to avoid TypeScript errors with the legacy user object
    const userId = (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid user session' });
    }

    const user = await authService.getUserById(userId);
    res.json(user);
  }

  /**
   * Legacy check session function
   *
   * GET /api/auth/check-session
   */
  static checkSession(req: Request, res: Response) {
    if (req.isAuthenticated()) {
      return res.status(200).json({ message: 'Session is valid' });
    } else {
      return res.status(401).json({ message: 'Session is invalid' });
    }
  }

  /**
   * Register a new user
   *
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const userData = authRegisterSchema.parse(req.body);

      // Register user
      const user = await authService.registerUser(userData as RegisterUserData);

      // Return user data
      return res.status(201).json({
        message:
          'User registered successfully. Please check your email to verify your account.',
        user,
      });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Login user
   *
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = authLoginSchema.parse(req.body);

      // Check if IP address is blocked
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const ipBlockCheck = await securityTrackingService.isIPBlocked(ipAddress);
      if (ipBlockCheck.isBlocked) {
        return res.status(403).json({
          message: 'Access temporarily blocked due to suspicious activity',
          reason: ipBlockCheck.reason,
          blockedAt: ipBlockCheck.blockedAt,
        });
      }

      // Try to authenticate the user
      const result = await authService.loginUser(data as LoginCredentials);

      if (!result) {
        return res.status(401).json({
          message: 'Invalid credentials',
        });
      }

      const { user } = result;

      // If 2FA is enabled for this user, we need to complete that flow first
      const twoFactorEnabled = await twoFactorAuthService.isEnabled(user.id);

      if (twoFactorEnabled) {
        // Generate a temporary token for 2FA verification
        const tempToken = jwt.sign(
          { userId: user.id, type: 'two-factor-temp' },
          JWT_SECRET,
          { expiresIn: '5m' } // Short expiry for security
        );

        return res.status(200).json({
          message: 'Two-factor authentication required',
          tempToken,
          userId: user.id,
          requiresTwoFactor: true,
        });
      }

      // Create access and refresh tokens
      const { accessToken, refreshToken, expiresIn } =
        await authService.generateTokens(user.id);

      // Track login for security analysis
      const securityAssessment =
        await securityTrackingService.trackLoginAttempt(
          user.id,
          ipAddress,
          userAgent
        );

      // If login is highly suspicious, require additional verification
      if (securityAssessment.riskLevel === 'high') {
        // Log the suspicious login attempt
        await securityTrackingService.trackLoginAttempt(
          user.id,
          ipAddress,
          userAgent
        );

        // Return warning with the tokens
        return res.status(200).json({
          message: 'Login successful but suspicious activity detected',
          accessToken,
          refreshToken,
          expiresIn,
          security: {
            suspicious: true,
            reasons: securityAssessment.reasons,
            riskLevel: securityAssessment.riskLevel,
          },
        });
      }

      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        expiresIn,
        security:
          securityAssessment.riskLevel !== 'low'
            ? {
                suspicious: securityAssessment.isSuspicious,
                reasons: securityAssessment.reasons,
                riskLevel: securityAssessment.riskLevel,
              }
            : undefined,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Verify two-factor authentication and complete login
   *
   * POST /api/auth/two-factor-login
   */
  async verifyTwoFactorLogin(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = TwoFactorLoginSchema.parse(req.body);

      // Verify 2FA token
      const result = await authService.verifyTwoFactorLogin(
        data.userId,
        data.temporaryToken,
        data.twoFactorCode
      );

      return res.status(200).json({
        message: 'Login successful',
        user: result.user,
        ...result.tokens,
      });
    } catch (error: any) {
      if (
        error.message === 'Invalid verification code' ||
        error.message === 'Invalid or expired temporary token'
      ) {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Device login (for mobile apps)
   *
   * POST /api/auth/device-login
   */
  async deviceLogin(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const credentials = DeviceLoginSchema.parse(req.body);

      // Login with device
      const result = await authService.deviceLogin(
        credentials.email,
        credentials.password,
        credentials.deviceId
      );

      return res.status(200).json({
        message: 'Device login successful',
        user: result.user,
        ...result.tokens,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ message: error.message });
      }
      if (error.message === 'Device not authorized') {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Refresh token
   *
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from body or cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          message: 'Refresh token is required',
        });
      }

      // Refresh token
      const tokens = await authService.refreshToken(refreshToken);

      // Update cookie if present
      if (req.cookies?.refreshToken) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      return res.status(200).json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error: any) {
      if (error.message === 'Invalid or expired refresh token') {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Logout user
   *
   * POST /api/auth/logout
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Get refresh token from body or cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (refreshToken) {
        // Invalidate refresh token
        await authService.logout(refreshToken);
      }

      if (req.refreshToken) {
        // Blacklist JWT token
        await authService.blacklistToken(req.refreshToken);
      }

      // Clear cookie if present
      if (req.cookies?.refreshToken) {
        res.clearCookie('refreshToken');
      }

      return res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   *
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = PasswordResetRequestSchema.parse(req.body);

      // Request password reset
      await authService.requestPasswordReset(data.email);

      return res.status(200).json({
        message:
          'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   *
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = PasswordResetSchema.parse(req.body);

      // Reset password
      await authService.resetPassword(data.token, data.newPassword);

      return res.status(200).json({
        message: 'Password has been reset successfully',
      });
    } catch (error: any) {
      if (error.message === 'Invalid or expired token') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Verify email
   *
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = EmailVerificationSchema.parse(req.body);

      // Verify email
      await emailValidationService.verifyEmail(data.token);

      return res.status(200).json({
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      if (error.message === 'Invalid or expired verification token') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Resend verification email
   *
   * POST /api/auth/resend-verification
   */
  async resendVerification(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Get user details
      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      // Resend verification email
      await emailValidationService.resendVerificationEmail(user.id, user.email);

      return res.status(200).json({
        message: 'Verification email has been resent',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Register a device
   *
   * POST /api/auth/register-device
   */
  async registerDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const deviceInfo = DeviceRegisterSchemaEnhanced.parse(req.body);

      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Register device
      const deviceId = await deviceAuthService.registerDevice(
        req.user.id,
        deviceInfo as DeviceRegistrationData,
        false // Do not auto-authorize
      );

      return res.status(201).json({
        message: 'Device registered successfully',
        deviceId,
        isAuthorized: false,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   *
   * GET /api/users/me
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Get user details
      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's devices
   *
   * GET /api/users/devices
   */
  async getUserDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const devices = await deviceAuthService.getUserDevices(req.user.id);

      return res.status(200).json(devices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authorize a device
   *
   * POST /api/users/devices/:deviceId/authorize
   */
  async authorizeDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      await deviceAuthService.authorizeDevice(deviceId);

      return res.status(200).json({
        message: 'Device authorized successfully',
      });
    } catch (error: any) {
      if (error.message === 'Device not found') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Revoke a device
   *
   * DELETE /api/users/devices/:deviceId
   */
  revokeDevice = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { deviceId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      await deviceAuthService.revokeDevice(deviceId);

      return res.status(200).json({
        message: 'Device revoked successfully',
      });
    } catch (error: any) {
      if (error.message === 'Device not found') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  };

  /**
   * Set up two-factor authentication
   *
   * POST /api/auth/setup-two-factor
   */
  async setupTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Get user details
      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      // Check if already enabled
      const isEnabled = await twoFactorAuthService.isEnabled(req.user.id);

      if (isEnabled) {
        return res.status(400).json({
          message: 'Two-factor authentication is already enabled',
        });
      }

      // Generate 2FA secret and QR code
      const twoFactorData = await twoFactorAuthService.generateSecret(
        req.user.id,
        user.email
      );

      return res.status(200).json({
        message: 'Two-factor authentication setup initiated',
        ...twoFactorData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify and enable two-factor authentication
   *
   * POST /api/auth/verify-two-factor
   */
  async verifyTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = TwoFactorVerifySchema.parse(req.body);

      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Verify and enable 2FA
      await twoFactorAuthService.verifyAndEnable(req.user.id, data.token);

      return res.status(200).json({
        message: 'Two-factor authentication has been enabled',
      });
    } catch (error: any) {
      if (error.message === 'Invalid verification code') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * Disable two-factor authentication
   *
   * POST /api/auth/disable-two-factor
   */
  async disableTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Disable 2FA
      await twoFactorAuthService.disable(req.user.id);

      return res.status(200).json({
        message: 'Two-factor authentication has been disabled',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate new backup codes for two-factor authentication
   *
   * POST /api/auth/two-factor/backup-codes
   */
  async generateBackupCodes(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      // Generate new backup codes
      const backupCodes = await twoFactorAuthService.regenerateBackupCodes(
        req.user.id
      );

      return res.status(200).json({
        message: 'New backup codes generated',
        backupCodes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
