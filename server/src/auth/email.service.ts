/**
 * Email Validation Service
 * Handles email verification for user registration
 */

import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import pool from '../db/pool';
import { redisClient } from '../lib/redis';

// Email verification token expiry in seconds (24 hours)
const EMAIL_VERIFICATION_EXPIRY = 86400;

export class EmailValidationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password',
      },
    });
  }

  /**
   * Generate a verification token and send verification email
   */
  async sendVerificationEmail(userId: string, email: string): Promise<string> {
    // Generate a unique token
    const token = uuidv4();

    // Store token in Redis with expiry
    await redisClient.set(
      `email_verification:${token}`,
      userId,
      'EX',
      EMAIL_VERIFICATION_EXPIRY
    );

    // Send verification email
    const verificationUrl = `${
      process.env.APP_URL || 'http://localhost:3000'
    }/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: 'Verify Your Email for Ventory',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Ventory!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't register for Ventory, please ignore this email.</p>
        </div>
      `,
    };

    await this.sendMail(mailOptions);

    // Update user record to show verification email sent
    await pool.query(
      'UPDATE users SET email_verification_sent = NOW() WHERE id = $1',
      [userId]
    );

    return token;
  }

  /**
   * Verify a user's email using the verification token
   */
  async verifyEmail(token: string): Promise<boolean> {
    // Check if token exists in Redis
    const userId = await redisClient.get(`email_verification:${token}`);

    if (!userId) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark user as verified in database
    await pool.query(
      'UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1',
      [userId]
    );

    // Remove token from Redis
    await redisClient.del(`email_verification:${token}`);

    return true;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(
    userId: string,
    email: string
  ): Promise<string> {
    // Check if user exists and is not already verified
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate a new verification token
    return this.sendVerificationEmail(userId, email);
  }

  /**
   * Send email using the configured transporter
   */
  async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<any> {
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}

export const emailValidationService = new EmailValidationService();
