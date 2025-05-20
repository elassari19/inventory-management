/**
 * Two-Factor Authentication Service
 * Implements 2FA functionality using TOTP (Time-based One-Time Password)
 */

import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pool from '../db/pool';

export class TwoFactorAuthService {
  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(
    userId: string,
    email: string
  ): Promise<{
    secret: string;
    otpauth_url: string;
    qrcode: string;
  }> {
    // Check if user already has 2FA enabled
    const existingResult = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error(
        'Two-factor authentication is already set up for this user'
      );
    }

    // Generate a secret
    const secret = authenticator.generateSecret();
    const appName = process.env.APP_NAME || 'Ventory';

    // Generate OTP auth URL
    const otpauthUrl = authenticator.keyuri(email, appName, secret);

    // Generate QR code
    const qrcode = await QRCode.toDataURL(otpauthUrl);

    // Create backup codes
    const backupCodes = this.generateBackupCodes();

    // Store in database (not enabled yet until verified)
    await pool.query(
      `INSERT INTO two_factor_auth (
        id, user_id, secret, backup_codes, is_enabled, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [uuidv4(), userId, secret, JSON.stringify(backupCodes), false]
    );

    return {
      secret,
      otpauth_url: otpauthUrl,
      qrcode,
    };
  }

  /**
   * Verify a TOTP code to enable 2FA
   */
  async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    // Get user's 2FA record
    const recordResult = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('Two-factor authentication not set up for this user');
    }

    const record = recordResult.rows[0];

    // If already enabled, don't allow re-enabling
    if (record.is_enabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Verify the token
    const isValid = authenticator.verify({
      token,
      secret: record.secret,
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    await pool.query(
      `UPDATE two_factor_auth 
       SET is_enabled = true, updated_at = NOW()
       WHERE id = $1`,
      [record.id]
    );

    return true;
  }

  /**
   * Verify a TOTP code for login
   */
  async verify(userId: string, token: string): Promise<boolean> {
    // Get user's 2FA record
    const recordResult = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1 AND is_enabled = true',
      [userId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('Two-factor authentication not enabled for this user');
    }

    const record = recordResult.rows[0];

    // Check if token is a backup code
    if (this.verifyBackupCode(record.backup_codes, token)) {
      // Remove the used backup code
      await this.useBackupCode(record.id, token);
      return true;
    }

    // Verify the TOTP token
    const isValid = authenticator.verify({
      token,
      secret: record.secret,
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM two_factor_auth WHERE user_id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Two-factor authentication not enabled for this user');
    }

    return true;
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async isEnabled(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1 AND is_enabled = true',
      [userId]
    );

    return result.rows.length > 0;
  }

  /**
   * Generate new backup codes for a user
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const recordResult = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('Two-factor authentication not set up for this user');
    }

    const record = recordResult.rows[0];
    const backupCodes = this.generateBackupCodes();

    await pool.query(
      `UPDATE two_factor_auth 
       SET backup_codes = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(backupCodes), record.id]
    );

    return backupCodes;
  }

  /**
   * Get user's backup codes
   */
  async getBackupCodes(userId: string): Promise<string[]> {
    const recordResult = await pool.query(
      'SELECT backup_codes FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('Two-factor authentication not set up for this user');
    }

    return recordResult.rows[0].backup_codes;
  }

  /**
   * Generate backup codes
   * Creates 10 random 8-character backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      codes.push(code);
    }

    return codes;
  }

  /**
   * Verify a backup code
   */
  private verifyBackupCode(backupCodes: string[], code: string): boolean {
    return backupCodes.includes(code);
  }

  /**
   * Use a backup code (removes it from available codes)
   */
  private async useBackupCode(recordId: string, code: string): Promise<void> {
    const recordResult = await pool.query(
      'SELECT backup_codes FROM two_factor_auth WHERE id = $1',
      [recordId]
    );

    if (recordResult.rows.length === 0) {
      return;
    }

    const backupCodes = recordResult.rows[0].backup_codes;
    const updatedCodes = backupCodes.filter((c: string) => c !== code);

    await pool.query(
      `UPDATE two_factor_auth 
       SET backup_codes = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedCodes), recordId]
    );
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
