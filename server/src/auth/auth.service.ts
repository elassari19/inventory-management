import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { redisClient } from '../lib/redis';
import { JwtPayload, AuthenticatedUser } from './auth.types';
import { emailValidationService } from './email.service';
import { deviceAuthService } from './device-auth.service';
import { twoFactorAuthService } from './two-factor-auth.service';
import {
  JWT_SECRET,
  JWT_EXPIRATION_TIME,
  DEVICE_JWT_SECRET,
  DEVICE_JWT_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRY,
  AUTH_COOKIE_NAME,
  BCRYPT_SALT_ROUNDS,
} from './auth.constants';
import { UserRegistrationSchema } from './auth.schema';

// Define interfaces
interface User {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Record<string, any>;
  language?: string;
  status?: string;
  created_at?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: DeviceRegistrationData;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Record<string, any>;
  language?: string;
  tenantId?: string;
  roles?: string[];
}

export interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  platform: string;
  osVersion: string;
  appVersion: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserWithTenants {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  tenants: Array<any>;
  [key: string]: any;
}

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class AuthService {
  /**
   * Register a new user with email validation
   */
  async registerUser(userData: RegisterUserData): Promise<UserWithTenants> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      userData.password,
      BCRYPT_SALT_ROUNDS
    );

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create user
      const userId = uuidv4();

      const userResult = await client.query(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name, phone, 
          address, language, status, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          userId,
          userData.email,
          passwordHash,
          userData.firstName || null,
          userData.lastName || null,
          userData.phone || null,
          userData.address ? JSON.stringify(userData.address) : null,
          userData.language || 'en',
          'ACTIVE',
          false, // Email not verified initially
        ]
      );

      const user = userResult.rows[0];

      // If tenant information is provided, create tenant association
      if (userData.tenantId) {
        await client.query(
          `INSERT INTO user_roles (
            id, user_id, tenant_id, role, permissions
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            uuidv4(),
            userId,
            userData.tenantId,
            userData.roles?.[0] || 'user',
            JSON.stringify({}),
          ]
        );
      }

      await client.query('COMMIT');

      // Send verification email
      await emailValidationService.sendVerificationEmail(
        userId,
        userData.email
      );

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;

      // Get user tenants
      const tenantsResult = await pool.query(
        `SELECT t.*, ur.role, ur.permissions
         FROM tenants t
         JOIN user_roles ur ON t.id = ur.tenant_id
         WHERE ur.user_id = $1`,
        [userId]
      );

      return {
        ...userWithoutPassword,
        tenants: tenantsResult.rows,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Login user with JWT token generation
   */
  async loginUser(credentials: LoginCredentials): Promise<{
    user: UserWithTenants;
    tokens: AuthTokens;
    requiresTwoFactor: boolean;
    temporaryToken?: string;
  }> {
    // Find user by email
    const userResult = await pool.query(
      `SELECT 
        id, email, password_hash, first_name, last_name, 
        phone, address, language, status, email_verified
       FROM users 
       WHERE email = $1 AND status = 'ACTIVE'`,
      [credentials.email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get user tenants
    const tenantsResult = await pool.query(
      `SELECT t.*, ur.role, ur.permissions
       FROM tenants t
       JOIN user_roles ur ON t.id = ur.tenant_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    // Check if 2FA is enabled
    const isTwoFactorEnabled = await twoFactorAuthService.isEnabled(user.id);

    // Create user object without password
    const { password_hash, ...userWithoutPassword } = user;
    const userWithTenants = {
      ...userWithoutPassword,
      tenants: tenantsResult.rows,
    };

    // If 2FA is enabled, return temporary token
    if (isTwoFactorEnabled) {
      // Generate a temporary token for 2FA verification
      const temporaryToken = jwt.sign(
        { userId: user.id, type: 'two-factor-temp' },
        JWT_SECRET,
        { expiresIn: '5m' } // Short expiry for security
      );

      return {
        user: userWithTenants,
        tokens: { accessToken: '', refreshToken: '', expiresIn: 0 },
        requiresTwoFactor: true,
        temporaryToken,
      };
    }

    // Update last login timestamp
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [
      user.id,
    ]);

    // Generate JWT tokens
    const tokens = await this.generateTokens(user.id);

    // Register device if device info is provided
    if (credentials.deviceInfo) {
      await deviceAuthService.registerDevice(
        user.id,
        credentials.deviceInfo,
        true // Auto-authorize on login
      );
    }

    // Log login activity
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, NOW()
      )`,
      [user.id, 'USER_LOGIN', 'SUCCESS']
    );

    return {
      user: userWithTenants,
      tokens,
      requiresTwoFactor: false,
    };
  }

  /**
   * Login with device ID
   */
  async deviceLogin(
    email: string,
    password: string,
    deviceId: string
  ): Promise<{
    user: UserWithTenants;
    tokens: AuthTokens;
  }> {
    // Find user by email
    const userResult = await pool.query(
      `SELECT 
        id, email, password_hash, first_name, last_name, 
        phone, address, language, status, email_verified
       FROM users 
       WHERE email = $1 AND status = 'ACTIVE'`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get device record
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE user_id = $1 AND device_id = $2`,
      [user.id, deviceId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not registered');
    }

    const device = deviceResult.rows[0];

    // Check if device is authorized
    if (!device.is_authorized) {
      throw new Error('Device not authorized');
    }

    // Get user tenants
    const tenantsResult = await pool.query(
      `SELECT t.*, ur.role, ur.permissions
       FROM tenants t
       JOIN user_roles ur ON t.id = ur.tenant_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    // Create user object without password
    const { password_hash, ...userWithoutPassword } = user;
    const userWithTenants = {
      ...userWithoutPassword,
      tenants: tenantsResult.rows,
    };

    // Update last login timestamp
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [
      user.id,
    ]);

    // Update device last used timestamp
    await pool.query(
      'UPDATE user_devices SET last_used = NOW() WHERE id = $1',
      [device.id]
    );

    // Generate device-specific tokens
    const tokens = await deviceAuthService.createDeviceSession(
      user.id,
      device.id
    );

    // Log device login activity
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [user.id, 'DEVICE_LOGIN', deviceId, 'SUCCESS']
    );

    return {
      user: userWithTenants,
      tokens,
    };
  }

  /**
   * Verify two-factor authentication code and complete login
   */
  async verifyTwoFactorLogin(
    userId: string,
    temporaryToken: string,
    twoFactorCode: string
  ): Promise<{
    user: UserWithTenants;
    tokens: AuthTokens;
  }> {
    try {
      // Verify temporary token
      const decoded = jwt.verify(temporaryToken, JWT_SECRET) as {
        userId: string;
        type: string;
      };

      // Check if token is for the correct user and type
      if (decoded.userId !== userId || decoded.type !== 'two-factor-temp') {
        throw new Error('Invalid or expired temporary token');
      }

      // Verify 2FA code
      const isValid = await twoFactorAuthService.verify(userId, twoFactorCode);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Get user details
      const user = await this.getUserById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Update last login timestamp
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [
        userId,
      ]);

      // Generate JWT tokens
      const tokens = await this.generateTokens(userId);

      // Log successful 2FA login
      await pool.query(
        `INSERT INTO auth_logs (
          id, user_id, action, status, metadata, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, NOW()
        )`,
        [
          userId,
          'TWO_FACTOR_LOGIN',
          'SUCCESS',
          JSON.stringify({ method: 'totp' }),
        ]
      );

      return { user, tokens };
    } catch (error) {
      // Log failed 2FA attempt
      await pool.query(
        `INSERT INTO auth_logs (
          id, user_id, action, status, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, NOW()
        )`,
        [userId, 'TWO_FACTOR_LOGIN', 'FAILED']
      );

      throw error;
    }
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  async generateTokens(userId: string, tenantId?: string): Promise<AuthTokens> {
    // Create JWT payload
    const payload: any = {
      userId,
      type: 'access',
    };

    if (tenantId) {
      payload.tenantId = tenantId;

      // Get user roles for this tenant
      const rolesResult = await pool.query(
        `SELECT role FROM user_roles 
         WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );

      if (rolesResult.rows.length > 0) {
        payload.roles = rolesResult.rows.map((r) => r.role);
      }
    }

    // Generate access token
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION_TIME,
    });

    // Generate refresh token
    const refreshToken = uuidv4();

    // Store refresh token in Redis with expiry
    await redisClient.set(
      `refresh_token:${refreshToken}`,
      userId,
      'EX',
      REFRESH_TOKEN_EXPIRY
    );

    // Calculate token expiry in seconds
    let expiresIn: number;

    if (typeof JWT_EXPIRATION_TIME === 'string') {
      // Parse time strings like '1h', '7d', etc.
      const match = JWT_EXPIRATION_TIME.match(/^(\d+)([smhdw])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];

        const unitMultipliers: Record<string, number> = {
          s: 1,
          m: 60,
          h: 60 * 60,
          d: 24 * 60 * 60,
          w: 7 * 24 * 60 * 60,
        };

        expiresIn = value * unitMultipliers[unit];
      } else {
        // Default to 1 hour if format is invalid
        expiresIn = 60 * 60;
      }
    } else {
      // If it's a number, treat it as seconds
      expiresIn = JWT_EXPIRATION_TIME;
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Check if refresh token exists in Redis
    const userId = await redisClient.get(`refresh_token:${refreshToken}`);

    if (!userId) {
      throw new Error('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await redisClient.del(`refresh_token:${refreshToken}`);

    // Generate new tokens
    return this.generateTokens(userId);
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<boolean> {
    await redisClient.del(`refresh_token:${refreshToken}`);
    return true;
  }

  /**
   * Blacklist an active JWT token
   */
  async blacklistToken(token: string): Promise<boolean> {
    try {
      // Decode token without verification to get expiry
      const decoded = jwt.decode(token) as { exp?: number };

      // Calculate TTL (time to expiry)
      let ttl = 0;

      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        ttl = decoded.exp - now;

        // If token is already expired, no need to blacklist
        if (ttl <= 0) {
          return true;
        }
      }

      // Add token to blacklist
      await redisClient.set(
        `blacklist:${token}`,
        '1',
        'EX',
        ttl > 0 ? ttl : REFRESH_TOKEN_EXPIRY
      );

      return true;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    // Find user by email
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND status = 'ACTIVE'",
      [email]
    );

    // If no user found, still return true (for security)
    if (userResult.rows.length === 0) {
      return true;
    }

    const user = userResult.rows[0];

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await pool.query(
      `INSERT INTO password_reset_tokens 
       (id, user_id, token, expires_at, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`,
      [user.id, token, expiresAt]
    );

    // Send password reset email
    const resetUrl = `${
      process.env.APP_URL || 'http://localhost:3000'
    }/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: 'Reset Your Ventory Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset for your Ventory account. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    // Send email using the email service
    await emailValidationService.sendMail(mailOptions);

    return true;
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired token');
    }

    const resetToken = tokenResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [resetToken.id]
    );

    return true;
  }

  /**
   * Get user by ID with tenant info
   */
  async getUserById(userId: string): Promise<UserWithTenants | null> {
    const userResult = await pool.query(
      `SELECT id, email, first_name, last_name, phone, address, 
       language, status, email_verified, email_verified_at, created_at, 
       updated_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Get user tenants
    const tenantsResult = await pool.query(
      `SELECT t.*, ur.role, ur.permissions
       FROM tenants t
       JOIN user_roles ur ON t.id = ur.tenant_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return {
      ...user,
      tenants: tenantsResult.rows,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
