/**
 * Enhanced Auth Routes
 * Defines all authentication-related routes
 */

import express from 'express';
import { authController } from './auth.controller';
import {
  authenticateJWT,
  authRateLimiter,
  logAuthActivity,
  Request,
  AuthRequest,
} from './auth.middleware';

const router = express.Router();

// Public routes
router.post<{}, {}, Request>(
  '/register',
  authRateLimiter,
  logAuthActivity('USER_REGISTER'),
  authController.register.bind(authController)
);

router.post<{}, {}, Request>(
  '/login',
  authRateLimiter,
  logAuthActivity('USER_LOGIN'),
  authController.login.bind(authController)
);

router.post<{}, {}, Request>(
  '/two-factor-login',
  authRateLimiter,
  logAuthActivity('TWO_FACTOR_LOGIN'),
  authController.verifyTwoFactorLogin.bind(authController)
);

router.post<{}, {}, Request>(
  '/device-login',
  authRateLimiter,
  logAuthActivity('DEVICE_LOGIN'),
  authController.deviceLogin.bind(authController)
);

router.post<{}, {}, Request>(
  '/refresh-token',
  authRateLimiter,
  logAuthActivity('TOKEN_REFRESH'),
  authController.refreshToken.bind(authController)
);

router.post<{}, {}, Request>(
  '/forgot-password',
  authRateLimiter,
  logAuthActivity('PASSWORD_RESET_REQUEST'),
  authController.forgotPassword.bind(authController)
);

router.post<{}, {}, Request>(
  '/reset-password',
  authRateLimiter,
  logAuthActivity('PASSWORD_RESET'),
  authController.resetPassword.bind(authController)
);

router.post<{}, {}, Request>(
  '/verify-email',
  authRateLimiter,
  logAuthActivity('EMAIL_VERIFY'),
  authController.verifyEmail.bind(authController)
);

// Protected routes (require authentication)
router.post<{}, {}, AuthRequest>(
  '/logout',
  authenticateJWT,
  logAuthActivity('USER_LOGOUT'),
  authController.logout.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/resend-verification',
  authenticateJWT,
  logAuthActivity('EMAIL_VERIFY_RESEND'),
  authController.resendVerification.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/register-device',
  authenticateJWT,
  logAuthActivity('DEVICE_REGISTER'),
  authController.registerDevice.bind(authController)
);

// Two-factor authentication routes
router.post<{}, {}, AuthRequest>(
  '/setup-two-factor',
  authenticateJWT,
  logAuthActivity('SETUP_TWO_FACTOR'),
  authController.setupTwoFactor.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/verify-two-factor',
  authenticateJWT,
  logAuthActivity('VERIFY_TWO_FACTOR'),
  authController.verifyTwoFactor.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/disable-two-factor',
  authenticateJWT,
  logAuthActivity('DISABLE_TWO_FACTOR'),
  authController.disableTwoFactor.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/two-factor/backup-codes',
  authenticateJWT,
  logAuthActivity('GENERATE_BACKUP_CODES'),
  authController.generateBackupCodes.bind(authController)
);

// Tenant switching routes
router.get<{}, {}, AuthRequest>(
  '/tenants',
  authenticateJWT,
  authController.getUserTenants.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/switch-tenant',
  authenticateJWT,
  logAuthActivity('TENANT_SWITCH'),
  authController.switchTenant.bind(authController)
);

// Mobile authentication routes
router.post<{}, {}, AuthRequest>(
  '/offline-token',
  authenticateJWT,
  logAuthActivity('OFFLINE_TOKEN_CREATE'),
  authController.createOfflineToken.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/biometric-auth',
  authenticateJWT,
  logAuthActivity('BIOMETRIC_AUTH'),
  authController.biometricAuth.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/enable-biometric',
  authenticateJWT,
  logAuthActivity('BIOMETRIC_ENABLE'),
  authController.enableBiometric.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/disable-biometric',
  authenticateJWT,
  logAuthActivity('BIOMETRIC_DISABLE'),
  authController.disableBiometric.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/secure-credentials',
  authenticateJWT,
  logAuthActivity('SECURE_CREDENTIALS_STORE'),
  authController.storeSecureCredentials.bind(authController)
);

router.get<{}, {}, AuthRequest>(
  '/secure-credentials/:deviceId',
  authenticateJWT,
  authController.getSecureCredentials.bind(authController)
);

router.delete<{}, {}, AuthRequest>(
  '/secure-credentials/:deviceId',
  authenticateJWT,
  logAuthActivity('SECURE_CREDENTIALS_CLEAR'),
  authController.clearSecureCredentials.bind(authController)
);

// Security routes
router.get<{}, {}, AuthRequest>(
  '/security/suspicious-logins',
  authenticateJWT,
  authController.getSuspiciousLogins.bind(authController)
);

router.post<{}, {}, AuthRequest>(
  '/security/block-ip',
  authenticateJWT,
  logAuthActivity('IP_BLOCK'),
  authController.blockIP.bind(authController)
);

// User routes
const userRouter = express.Router();

userRouter.get<{}, {}, AuthRequest>(
  '/me',
  authenticateJWT,
  authController.getCurrentUser.bind(authController)
);

userRouter.get<{}, {}, AuthRequest>(
  '/devices',
  authenticateJWT,
  authController.getUserDevices.bind(authController)
);

userRouter.post<{}, {}, AuthRequest>(
  '/devices/:deviceId/authorize',
  authenticateJWT,
  logAuthActivity('DEVICE_AUTHORIZE'),
  authController.authorizeDevice.bind(authController)
);

userRouter.delete<{}, {}, AuthRequest>(
  '/devices/:deviceId',
  authenticateJWT,
  logAuthActivity('DEVICE_REVOKE'),
  authController.revokeDevice.bind(authController)
);

export { router as authRouter, userRouter };
