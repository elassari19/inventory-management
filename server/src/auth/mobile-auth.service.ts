/**
 * Mobile Authentication Service
 * Handles specialized authentication features for mobile devices including
 * offline authentication, biometric support, and secure credential storage
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { redisClient } from '../lib/redis';
import { deviceAuthService } from './device-auth.service';
import {
  DEVICE_JWT_SECRET,
  DEVICE_JWT_EXPIRATION_TIME,
} from './auth.constants';
import { JwtPayload } from './auth.types';

export class MobileAuthService {
  /**
   * Create an offline access token for mobile devices
   * This token can be used for a limited time without internet connectivity
   */
  async createOfflineToken(
    userId: string,
    deviceId: string,
    tenantId: string,
    expiryHours: number = 24 // Default 24 hours
  ): Promise<string> {
    // Get device to verify it belongs to user and is authorized
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2 AND is_authorized = true`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found or not authorized');
    }

    // Get user permissions for this tenant
    const rolesResult = await pool.query(
      `SELECT role, permissions FROM user_roles
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (rolesResult.rows.length === 0) {
      throw new Error('User does not have access to this tenant');
    }

    // Create token payload with limited permissions for offline use
    const roles = rolesResult.rows.map((r) => r.role);

    // Collect permissions from all roles
    const permissions = new Set<string>();
    rolesResult.rows.forEach((r) => {
      if (r.permissions && Array.isArray(r.permissions)) {
        r.permissions.forEach((p) => {
          // Only include read permissions for offline access
          if (p.includes(':read')) {
            permissions.add(p);
          }
        });
      }
    });

    // Calculate expiry time
    const expiryTime = Math.floor(Date.now() / 1000) + expiryHours * 60 * 60;

    // Create payload
    const payload: JwtPayload = {
      userId,
      deviceId,
      tenantId,
      roles,
      permissions: Array.from(permissions),
      exp: expiryTime,
      iat: Math.floor(Date.now() / 1000),
      type: 'offline',
    };

    // Sign token with device-specific secret
    const offlineToken = jwt.sign(payload, DEVICE_JWT_SECRET);

    // Log offline token creation
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, tenant_id, metadata, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW()
      )`,
      [
        userId,
        'OFFLINE_TOKEN_CREATED',
        deviceId,
        'SUCCESS',
        tenantId,
        JSON.stringify({ expiryHours }),
      ]
    );

    return offlineToken;
  }

  /**
   * Verify a biometric authentication request
   * This should be called after the device has verified biometrics locally
   */
  async verifyBiometricAuth(
    userId: string,
    deviceId: string,
    biometricSignature: string,
    tenantId?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Check if biometric auth is enabled for this user/device
    const biometricResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2 AND is_authorized = true`,
      [deviceId, userId]
    );

    if (biometricResult.rows.length === 0) {
      throw new Error('Device not found or not authorized');
    }

    const device = biometricResult.rows[0];

    // Verify biometric signature
    // In a real implementation, this would validate the signature
    // Here we just check that it's provided
    if (!biometricSignature) {
      throw new Error('Invalid biometric signature');
    }

    // Create a device session
    const tokens = await deviceAuthService.createDeviceSession(
      userId,
      deviceId,
      tenantId
    );

    // Log biometric login
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, tenant_id, metadata, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW()
      )`,
      [
        userId,
        'BIOMETRIC_LOGIN',
        deviceId,
        'SUCCESS',
        tenantId || null,
        JSON.stringify({ method: 'biometric' }),
      ]
    );

    return tokens;
  }

  /**
   * Enable biometric authentication for a device
   */
  async enableBiometricAuth(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    // Check if device exists and belongs to user
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2 AND is_authorized = true`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found or not authorized');
    }

    // Update device record to enable biometric authentication
    await pool.query(
      `UPDATE user_devices
       SET biometric_enabled = true,
           updated_at = NOW()
       WHERE id = $1`,
      [deviceId]
    );

    // Log biometric setup
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [userId, 'BIOMETRIC_ENABLED', deviceId, 'SUCCESS']
    );

    return true;
  }

  /**
   * Disable biometric authentication for a device
   */
  async disableBiometricAuth(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    // Check if device exists and belongs to user
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found');
    }

    // Update device record to disable biometric authentication
    await pool.query(
      `UPDATE user_devices
       SET biometric_enabled = false,
           updated_at = NOW()
       WHERE id = $1`,
      [deviceId]
    );

    // Log biometric removal
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [userId, 'BIOMETRIC_DISABLED', deviceId, 'SUCCESS']
    );

    return true;
  }

  /**
   * Store encrypted credentials for mobile app
   * This allows secure storage of credentials for offline use
   */
  async storeSecureCredentials(
    userId: string,
    deviceId: string,
    encryptedCredentials: string,
    encryptionMetadata: Record<string, any>
  ): Promise<boolean> {
    // Check if device exists and belongs to user
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2 AND is_authorized = true`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found or not authorized');
    }

    // Store encrypted credentials
    await pool.query(
      `UPDATE user_devices
       SET secure_credentials = $1,
           encryption_metadata = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [encryptedCredentials, JSON.stringify(encryptionMetadata), deviceId]
    );

    // Log credential storage
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [userId, 'SECURE_CREDENTIALS_STORED', deviceId, 'SUCCESS']
    );

    return true;
  }

  /**
   * Retrieve encrypted credentials for mobile app
   */
  async getSecureCredentials(
    userId: string,
    deviceId: string
  ): Promise<{
    encryptedCredentials: string;
    encryptionMetadata: Record<string, any>;
  } | null> {
    // Check if device exists and belongs to user
    const deviceResult = await pool.query(
      `SELECT secure_credentials, encryption_metadata
       FROM user_devices 
       WHERE id = $1 AND user_id = $2 AND is_authorized = true`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found or not authorized');
    }

    const device = deviceResult.rows[0];

    if (!device.secure_credentials) {
      return null;
    }

    return {
      encryptedCredentials: device.secure_credentials,
      encryptionMetadata: device.encryption_metadata || {},
    };
  }

  /**
   * Clear stored credentials for a device
   */
  async clearSecureCredentials(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    // Check if device exists and belongs to user
    const deviceResult = await pool.query(
      `SELECT * FROM user_devices 
       WHERE id = $1 AND user_id = $2`,
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found');
    }

    // Clear credentials
    await pool.query(
      `UPDATE user_devices
       SET secure_credentials = NULL,
           encryption_metadata = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [deviceId]
    );

    // Log credential removal
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [userId, 'SECURE_CREDENTIALS_CLEARED', deviceId, 'SUCCESS']
    );

    return true;
  }
}

export const mobileAuthService = new MobileAuthService();
