// JWT Constants
export const JWT_SECRET =
  process.env.JWT_SECRET || 'your-very-strong-secret-key'; // IMPORTANT: Use environment variable in production
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || '1h'; // e.g., '1h', '7d'

// Device Token Constants (if different from user JWTs)
export const DEVICE_JWT_SECRET =
  process.env.DEVICE_JWT_SECRET || 'your-device-specific-secret-key';
export const DEVICE_JWT_EXPIRATION_TIME =
  process.env.DEVICE_JWT_EXPIRATION_TIME || '30d'; // Devices might have longer-lived tokens

// Cookie Names (if using cookies for web sessions)
export const AUTH_COOKIE_NAME = 'auth-token';

// Default Roles (example)
export const DEFAULT_USER_ROLE = 'user';
export const TENANT_ADMIN_ROLE = 'tenant_admin';
export const TENANT_SCANNER_ROLE = 'scanner_device'; // Role for scanning devices

// Other auth-related constants
export const BCRYPT_SALT_ROUNDS = 10;
