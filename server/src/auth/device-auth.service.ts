/**
 * Device Authentication Service
 * Handles device-specific authentication functionality including:
 * - Device registration and management
 * - Device verification
 * - Device-specific tokens
 * - Device sessions
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool from '../db/pool';
import { redisClient } from '../lib/redis';
import {
  DEVICE_JWT_SECRET,
  DEVICE_JWT_EXPIRATION_TIME,
  TENANT_SCANNER_ROLE,
} from './auth.constants';
import { JwtPayload, DeviceRegistrationData } from './auth.types';

export class DeviceAuthService {
  /**
   * Register a new device or update existing device
   */
  async registerDevice(
    userId: string,
    deviceInfo: DeviceRegistrationData,
    autoAuthorize: boolean = false
  ): Promise<string> {
    // Check if device already exists for this user
    const existingDeviceResult = await pool.query(
      `SELECT * FROM user_devices
       WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceInfo.deviceId]
    );

    const now = new Date();

    if (existingDeviceResult.rows.length > 0) {
      // Update existing device
      const device = existingDeviceResult.rows[0];

      await pool.query(
        `UPDATE user_devices
         SET device_name = $1,
             device_model = $2,
             platform = $3,
             os_version = $4,
             app_version = $5,
             last_used = $6,
             updated_at = $6
         WHERE id = $7`,
        [
          deviceInfo.deviceName,
          deviceInfo.deviceModel,
          deviceInfo.platform,
          deviceInfo.osVersion,
          deviceInfo.appVersion,
          now,
          device.id,
        ]
      );

      return device.id;
    } else {
      // Create new device
      const deviceId = uuidv4();

      await pool.query(
        `INSERT INTO user_devices (
          id, user_id, device_id, device_name, device_model,
          platform, os_version, app_version, last_used,
          is_authorized, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
        [
          deviceId,
          userId,
          deviceInfo.deviceId,
          deviceInfo.deviceName,
          deviceInfo.deviceModel,
          deviceInfo.platform,
          deviceInfo.osVersion,
          deviceInfo.appVersion,
          now,
          autoAuthorize, // Only auto-authorize if specified
          now,
        ]
      );

      // Log device registration
      await pool.query(
        `INSERT INTO auth_logs (
          id, user_id, action, device_id, status, metadata, created_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6
        )`,
        [
          userId,
          'DEVICE_REGISTERED',
          deviceInfo.deviceId,
          'SUCCESS',
          JSON.stringify(deviceInfo),
          now,
        ]
      );

      return deviceId;
    }
  }

  /**
   * Authorize a device for use
   */
  async authorizeDevice(deviceId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE user_devices
       SET is_authorized = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }

    // Log device authorization
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [
        result.rows[0].user_id,
        'DEVICE_AUTHORIZED',
        result.rows[0].device_id,
        'SUCCESS',
      ]
    );

    return true;
  }

  /**
   * Revoke authorization for a device
   */
  async revokeDevice(deviceId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE user_devices
       SET is_authorized = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }

    // Delete all active sessions for this device
    await pool.query(
      `DELETE FROM device_sessions
       WHERE device_id = $1`,
      [deviceId]
    );

    // Log device revocation
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, NOW()
      )`,
      [
        result.rows[0].user_id,
        'DEVICE_REVOKED',
        result.rows[0].device_id,
        'SUCCESS',
      ]
    );

    return true;
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string) {
    const result = await pool.query(
      `SELECT 
         id, device_id, device_name, device_model,
         platform, os_version, app_version, last_used,
         is_authorized, created_at, updated_at
       FROM user_devices
       WHERE user_id = $1
       ORDER BY last_used DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string) {
    const result = await pool.query(
      `SELECT 
         id, user_id, device_id, device_name, device_model,
         platform, os_version, app_version, last_used,
         is_authorized, created_at, updated_at
       FROM user_devices
       WHERE id = $1`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Create a device session with tokens
   */
  async createDeviceSession(
    userId: string,
    deviceId: string,
    tenantId?: string
  ) {
    // Get device record
    const deviceResult = await pool.query(
      'SELECT * FROM user_devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not found or not owned by user');
    }

    const device = deviceResult.rows[0];

    // Check if device is authorized
    if (!device.is_authorized) {
      throw new Error('Device is not authorized');
    }

    // Generate device token
    const payload: JwtPayload = {
      userId,
      deviceId,
      type: 'device',
    };

    if (tenantId) {
      payload.tenantId = tenantId;

      // Get user roles for the tenant
      const rolesResult = await pool.query(
        `SELECT role, permissions FROM user_roles
         WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );

      if (rolesResult.rows.length > 0) {
        payload.roles = rolesResult.rows.map((r) => r.role);

        // Collect permissions from all roles
        const permissions = new Set<string>();

        rolesResult.rows.forEach((r) => {
          if (r.permissions && Array.isArray(r.permissions)) {
            r.permissions.forEach((p) => permissions.add(p));
          }
        });

        if (permissions.size > 0) {
          payload.permissions = Array.from(permissions);
        }
      }
    }

    // Calculate expiry
    const expiresIn = DEVICE_JWT_EXPIRATION_TIME;
    let expiryTime: number;

    if (typeof expiresIn === 'string') {
      // Parse time strings like '30d', '24h', etc.
      const match = expiresIn.match(/^(\d+)([smhdw])$/);
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

        expiryTime =
          Math.floor(Date.now() / 1000) + value * unitMultipliers[unit];
      } else {
        // Default to 30 days if format is invalid
        expiryTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      }
    } else {
      // If it's a number, treat it as seconds
      expiryTime = Math.floor(Date.now() / 1000) + expiresIn;
    }

    payload.exp = expiryTime;
    payload.iat = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(payload, DEVICE_JWT_SECRET);

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Store device session in database
    const sessionId = uuidv4();
    const expiresAt = new Date(expiryTime * 1000);

    await pool.query(
      `INSERT INTO device_sessions (
        id, device_id, user_id, tenant_id, token,
        refresh_token, expires_at, created_at, last_activity_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        sessionId,
        deviceId,
        userId,
        tenantId || null,
        accessToken,
        refreshToken,
        expiresAt,
      ]
    );

    // Update device last used timestamp
    await pool.query(
      'UPDATE user_devices SET last_used = NOW() WHERE id = $1',
      [deviceId]
    );

    // Log device login
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, tenant_id, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
      )`,
      [userId, 'DEVICE_LOGIN', device.device_id, 'SUCCESS', tenantId || null]
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: expiryTime - Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Refresh a device token
   */
  async refreshDeviceToken(refreshToken: string) {
    // Find session by refresh token
    const sessionResult = await pool.query(
      `SELECT * FROM device_sessions
       WHERE refresh_token = $1 AND expires_at > NOW()`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    const session = sessionResult.rows[0];

    // Generate new tokens
    return this.createDeviceSession(
      session.user_id,
      session.device_id,
      session.tenant_id
    );
  }

  /**
   * Validate a device login
   */
  async validateDeviceLogin(
    userId: string,
    deviceId: string,
    tenantId?: string
  ) {
    // Get device record
    const deviceResult = await pool.query(
      'SELECT * FROM user_devices WHERE device_id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error('Device not registered');
    }

    const device = deviceResult.rows[0];

    // Check if device belongs to user
    if (device.user_id !== userId) {
      throw new Error('Device not owned by user');
    }

    // Check if device is authorized
    if (!device.is_authorized) {
      throw new Error('Device not authorized');
    }

    return this.createDeviceSession(userId, device.id, tenantId);
  }

  /**
   * Generate device fingerprint from device information
   * Used to identify devices across sessions
   */
  generateDeviceFingerprint(deviceInfo: DeviceRegistrationData): string {
    // Create a unique fingerprint based on device properties
    const fingerprint = crypto
      .createHash('sha256')
      .update(
        `${deviceInfo.deviceId}|${deviceInfo.deviceModel}|${deviceInfo.platform}`
      )
      .digest('hex');

    return fingerprint;
  }

  /**
   * End all sessions for a device
   */
  async endAllDeviceSessions(deviceId: string): Promise<boolean> {
    await pool.query('DELETE FROM device_sessions WHERE device_id = $1', [
      deviceId,
    ]);

    return true;
  }

  /**
   * Log device activity
   */
  async logDeviceActivity(
    userId: string,
    deviceId: string,
    action: string,
    metadata: any = {}
  ): Promise<void> {
    await pool.query(
      `INSERT INTO auth_logs (
        id, user_id, action, device_id, status, metadata, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
      )`,
      [userId, action, deviceId, 'SUCCESS', JSON.stringify(metadata)]
    );
  }
}

export const deviceAuthService = new DeviceAuthService();
