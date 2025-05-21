import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { redisClient } from '../lib/redis';
import { JwtPayload, AuthenticatedUser, DeviceInfo } from './auth.types';
import { emailValidationService } from './email.service';
import { deviceAuthService } from './device-auth.service';
import { twoFactorAuthService } from './two-factor-auth.service';
import { securityTrackingService } from './security-tracking.service';
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
import pool from '../db/pool';

export class AuthService {
  private static readonly pool: Pool = new Pool();

  /**
   * Register a new user
   */
  static async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthenticatedUser> {
    // Validate input
    const validatedData = UserRegistrationSchema.parse(userData);

    // Check if user exists
    const existingUser = await this.findUserByEmail(validatedData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      BCRYPT_SALT_ROUNDS
    );

    // Create user
    const userId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        userId,
        validatedData.email,
        hashedPassword,
        validatedData.firstName || null,
        validatedData.lastName || null,
      ]
    );

    const user = result.rows[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
    };
  }

  /**
   * Login user
   */
  static async login(credentials: {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthenticatedUser> {
    const user = await this.validateUser(
      credentials.email,
      credentials.password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Track login attempt and check if it's suspicious
    const securityCheck = await securityTrackingService.trackLoginAttempt(
      user.id,
      credentials.ipAddress!,
      credentials.userAgent!
    );

    if (securityCheck.isSuspicious && securityCheck.riskLevel === 'high') {
      throw new Error('Suspicious login activity detected');
    }

    // Handle device authentication if device info provided
    if (credentials.deviceInfo) {
      await deviceAuthService.registerDevice(user.id, credentials.deviceInfo);
    }

    return user;
  }

  /**
   * Validate user credentials
   */
  static async validateUser(
    email: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
    };
  }

  /**
   * Generate JWT token
   */
  static async generateToken(
    user: AuthenticatedUser,
    tenantId?: string
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: tenantId,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION_TIME,
    });
  }

  /**
   * Find user by email
   */
  private static async findUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return result.rows[0];
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate refresh token
   */
  static async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = uuidv4();
    await redisClient.setex(
      `refresh_token:${refreshToken}`,
      REFRESH_TOKEN_EXPIRY,
      userId
    );
    return refreshToken;
  }

  /**
   * Validate refresh token
   */
  static async validateRefreshToken(
    refreshToken: string
  ): Promise<string | null> {
    const userId = await redisClient.get(`refresh_token:${refreshToken}`);
    if (!userId) {
      return null;
    }
    return userId;
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await redisClient.del(`refresh_token:${refreshToken}`);
    }
  }
}
