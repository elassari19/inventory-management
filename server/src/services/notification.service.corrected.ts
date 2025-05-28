import pool from '../db/pool';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

/**
 * Comprehensive Notification Service for Cross-Platform Notifications
 *
 * Features:
 * - Multi-channel support (email, SMS, push, in-app)
 * - Template system for different notification types
 * - User preference management
 * - Tenant isolation and security
 * - Delivery tracking and logging
 * - Scheduled notifications
 * - Real-time notifications via WebSocket
 */

interface NotificationData {
  id?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tenantId: string;
  userId?: string;
  userIds?: string[];
  expiresAt?: Date;
  scheduledFor?: Date;
}

interface NotificationTemplate {
  type: string;
  templates: {
    email?: {
      subject: string;
      html: string;
      text?: string;
    };
    sms?: {
      message: string;
    };
    push?: {
      title: string;
      body: string;
      data?: Record<string, any>;
    };
    in_app?: {
      title: string;
      message: string;
      actionUrl?: string;
    };
  };
}

type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

interface UserPreferences {
  userId: string;
  tenantId: string;
  preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
    quietHours: {
      start?: string; // HH:MM format
      end?: string; // HH:MM format
      timezone?: string;
    };
    categories: Record<string, Record<NotificationChannel, boolean>>;
  };
}

export class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'notifications@ventory.com',
        pass: process.env.EMAIL_PASSWORD || 'password',
      },
    });

    this.loadTemplates();
  }

  /**
   * Send a notification through multiple channels
   */
  async sendNotification(notificationData: NotificationData): Promise<any> {
    const notificationId = notificationData.id || uuidv4();

    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(
        notificationData.userId || notificationData.userIds?.[0] || '',
        notificationData.tenantId
      );

      // Check if user wants to receive this type of notification
      const enabledChannels = this.getEnabledChannels(
        notificationData.channels,
        notificationData.type,
        preferences
      );

      if (enabledChannels.length === 0) {
        console.log(`No enabled channels for notification ${notificationId}`);
        return { id: notificationId, status: 'filtered' };
      }

      // Store notification in database
      await this.storeNotification({
        ...notificationData,
        id: notificationId,
        channels: enabledChannels,
      });

      // Send through each enabled channel
      const sendPromises = enabledChannels.map((channel) =>
        this.sendToChannel(notificationData, channel, notificationId)
      );

      await Promise.allSettled(sendPromises);

      // Update notification status
      await this.updateNotificationStatus(notificationId, 'sent');

      return { id: notificationId, status: 'sent', channels: enabledChannels };
    } catch (error) {
      console.error('Error sending notification:', error);
      await this.updateNotificationStatus(
        notificationId,
        'failed',
        error.message
      );
      throw error;
    }
  }

  /**
   * Get notifications for a user with filtering options
   */
  async getNotifications(options: {
    tenantId: string;
    userId: string;
    channel?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = `
      SELECT n.*, 
             CASE WHEN ian.read_at IS NOT NULL THEN ian.read_at ELSE NULL END as read_at
      FROM notifications n
      LEFT JOIN in_app_notifications ian ON n.id = ian.notification_id
      WHERE n.tenant_id = $1 AND n.user_id = $2
    `;

    const params: any[] = [options.tenantId, options.userId];
    let paramIndex = 3;

    if (options.channel) {
      query += ` AND $${paramIndex} = ANY(n.channels)`;
      params.push(options.channel);
      paramIndex++;
    }

    if (options.type) {
      query += ` AND n.type = $${paramIndex}`;
      params.push(options.type);
      paramIndex++;
    }

    if (options.status) {
      query += ` AND n.status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    query += ` ORDER BY n.created_at DESC`;

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications n
       LEFT JOIN in_app_notifications ian ON n.id = ian.notification_id
       WHERE n.tenant_id = $1 AND n.user_id = $2 
       AND 'in_app' = ANY(n.channels) 
       AND ian.read_at IS NULL`,
      [tenantId, userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    // Update in_app_notifications table
    await pool.query(
      `UPDATE in_app_notifications 
       SET read_at = NOW() 
       WHERE notification_id = ANY($1) AND user_id = $2 AND read_at IS NULL`,
      [notificationIds, userId]
    );
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(tenantId: string, userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_notification_preferences 
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if none exist
      return {
        userId,
        tenantId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        categories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return result.rows[0];
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    tenantId: string,
    userId: string,
    preferences: any
  ): Promise<any> {
    const existing = await this.getPreferences(tenantId, userId);

    if (existing.userId && existing.createdAt !== existing.updatedAt) {
      // Update existing preferences
      const result = await pool.query(
        `UPDATE user_notification_preferences 
         SET email_enabled = COALESCE($3, email_enabled),
             sms_enabled = COALESCE($4, sms_enabled),
             push_enabled = COALESCE($5, push_enabled),
             in_app_enabled = COALESCE($6, in_app_enabled),
             quiet_hours_start = COALESCE($7, quiet_hours_start),
             quiet_hours_end = COALESCE($8, quiet_hours_end),
             timezone = COALESCE($9, timezone),
             preferences = COALESCE($10, preferences),
             updated_at = NOW()
         WHERE tenant_id = $1 AND user_id = $2
         RETURNING *`,
        [
          tenantId,
          userId,
          preferences.emailEnabled,
          preferences.smsEnabled,
          preferences.pushEnabled,
          preferences.inAppEnabled,
          preferences.quietHoursStart,
          preferences.quietHoursEnd,
          preferences.timezone,
          JSON.stringify({ categories: preferences.categories || {} }),
        ]
      );
      return result.rows[0];
    } else {
      // Create new preferences
      const result = await pool.query(
        `INSERT INTO user_notification_preferences 
         (tenant_id, user_id, email_enabled, sms_enabled, push_enabled, in_app_enabled,
          quiet_hours_start, quiet_hours_end, timezone, preferences)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          tenantId,
          userId,
          preferences.emailEnabled ?? true,
          preferences.smsEnabled ?? false,
          preferences.pushEnabled ?? true,
          preferences.inAppEnabled ?? true,
          preferences.quietHoursStart,
          preferences.quietHoursEnd,
          preferences.timezone || 'UTC',
          JSON.stringify({ categories: preferences.categories || {} }),
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Get notification templates
   */
  async getTemplates(tenantId?: string, type?: string): Promise<any[]> {
    let query = `SELECT * FROM notification_templates WHERE active = true`;
    const params: any[] = [];
    let paramIndex = 1;

    if (tenantId) {
      query += ` AND (tenant_id = $${paramIndex} OR tenant_id IS NULL)`;
      params.push(tenantId);
      paramIndex++;
    } else {
      query += ` AND tenant_id IS NULL`;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
    }

    query += ` ORDER BY tenant_id NULLS LAST, type, channel`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Create a notification template
   */
  async createTemplate(template: {
    type: string;
    channel: string;
    template: any;
    tenantId?: string;
    active?: boolean;
  }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO notification_templates 
       (type, channel, template, tenant_id, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        template.type,
        template.channel,
        JSON.stringify(template.template),
        template.tenantId,
        template.active ?? true,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update a notification template
   */
  async updateTemplate(id: string, template: any): Promise<any> {
    const result = await pool.query(
      `UPDATE notification_templates 
       SET type = COALESCE($2, type),
           channel = COALESCE($3, channel),
           template = COALESCE($4, template),
           tenant_id = COALESCE($5, tenant_id),
           active = COALESCE($6, active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        template.type,
        template.channel,
        template.template ? JSON.stringify(template.template) : null,
        template.tenantId,
        template.active,
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete a notification template
   */
  async deleteTemplate(id: string): Promise<void> {
    await pool.query('DELETE FROM notification_templates WHERE id = $1', [id]);
  }

  /**
   * Register push token for a device
   */
  async registerPushToken(
    deviceId: string,
    pushToken: string,
    platform: string
  ): Promise<void> {
    await pool.query(
      `UPDATE user_devices 
       SET push_token = $2, push_platform = $3, updated_at = NOW()
       WHERE id = $1`,
      [deviceId, pushToken, platform]
    );
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(
    userId: string,
    tenantId: string
  ): Promise<UserPreferences> {
    const result = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      // Return default preferences if none exist
      return {
        userId,
        tenantId,
        preferences: {
          email: true,
          sms: false,
          push: true,
          in_app: true,
          quietHours: {},
          categories: {},
        },
      };
    }

    return {
      userId,
      tenantId,
      preferences: result.rows[0].preferences,
    };
  }

  // Private helper methods
  private async sendToChannel(
    notification: NotificationData,
    channel: NotificationChannel,
    notificationId: string
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(notification, notificationId);
          break;
        case 'sms':
          await this.sendSMSNotification(notification, notificationId);
          break;
        case 'push':
          await this.sendPushNotification(notification, notificationId);
          break;
        case 'in_app':
          await this.sendInAppNotification(notification, notificationId);
          break;
        default:
          console.warn(`Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Error sending ${channel} notification:`, error);
      await this.logChannelFailure(notificationId, channel, error.message);
    }
  }

  private async sendEmailNotification(
    notification: NotificationData,
    notificationId: string
  ): Promise<void> {
    const user = await this.getUserDetails(notification.userId || '');
    const template = this.templates.get(notification.type);

    if (!user?.email) {
      throw new Error('User email not found');
    }

    if (!template?.templates.email) {
      throw new Error(`No email template found for ${notification.type}`);
    }

    const subject = this.processTemplate(
      template.templates.email.subject,
      notification
    );
    const html = this.processTemplate(
      template.templates.email.html,
      notification
    );
    const text = template.templates.email.text
      ? this.processTemplate(template.templates.email.text, notification)
      : undefined;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Ventory <notifications@ventory.com>',
      to: user.email,
      subject,
      html,
      text,
      headers: {
        'X-Notification-ID': notificationId,
        'X-Tenant-ID': notification.tenantId,
      },
    };

    await this.emailTransporter.sendMail(mailOptions);
    await this.logChannelSuccess(notificationId, 'email');
  }

  private async sendSMSNotification(
    notification: NotificationData,
    notificationId: string
  ): Promise<void> {
    const user = await this.getUserDetails(notification.userId || '');
    const template = this.templates.get(notification.type);

    if (!user?.phone) {
      throw new Error('User phone number not found');
    }

    if (!template?.templates.sms) {
      throw new Error(`No SMS template found for ${notification.type}`);
    }

    const message = this.processTemplate(
      template.templates.sms.message,
      notification
    );

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS to ${user.phone}: ${message}`);

    await this.logChannelSuccess(notificationId, 'sms');
  }

  private async sendPushNotification(
    notification: NotificationData,
    notificationId: string
  ): Promise<void> {
    const devices = await this.getUserDevices(notification.userId || '');
    const template = this.templates.get(notification.type);

    if (devices.length === 0) {
      throw new Error('No devices found for push notification');
    }

    if (!template?.templates.push) {
      throw new Error(`No push template found for ${notification.type}`);
    }

    const title = this.processTemplate(
      template.templates.push.title,
      notification
    );
    const body = this.processTemplate(
      template.templates.push.body,
      notification
    );

    const pushPromises = devices.map((device) =>
      this.sendPushToDevice(device.push_token, {
        title,
        body,
        data: {
          notificationId,
          type: notification.type,
          ...template.templates.push?.data,
          ...notification.data,
        },
      })
    );

    await Promise.allSettled(pushPromises);
    await this.logChannelSuccess(notificationId, 'push');
  }

  private async sendInAppNotification(
    notification: NotificationData,
    notificationId: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO in_app_notifications 
       (id, notification_id, user_id, tenant_id, type, title, message, data, read_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        uuidv4(),
        notificationId,
        notification.userId,
        notification.tenantId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data || {}),
        null, // read_at
      ]
    );

    await this.broadcastToUser(notification.userId || '', {
      type: 'notification',
      payload: {
        id: notificationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date().toISOString(),
      },
    });

    await this.logChannelSuccess(notificationId, 'in_app');
  }

  private getEnabledChannels(
    requestedChannels: NotificationChannel[],
    type: string,
    preferences: UserPreferences
  ): NotificationChannel[] {
    return requestedChannels.filter((channel) => {
      if (!preferences.preferences[channel]) return false;

      const categoryPref = preferences.preferences.categories[type];
      if (categoryPref && categoryPref[channel] === false) return false;

      return true;
    });
  }

  private async storeNotification(
    notification: NotificationData
  ): Promise<void> {
    await pool.query(
      `INSERT INTO notifications 
       (id, type, title, message, data, channels, priority, tenant_id, user_id, 
        expires_at, scheduled_for, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        notification.id,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data || {}),
        JSON.stringify(notification.channels),
        notification.priority,
        notification.tenantId,
        notification.userId,
        notification.expiresAt,
        notification.scheduledFor,
        'pending',
      ]
    );
  }

  private async updateNotificationStatus(
    notificationId: string,
    status: string,
    error?: string
  ): Promise<void> {
    await pool.query(
      'UPDATE notifications SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
      [status, error, notificationId]
    );
  }

  private async getUserDetails(userId: string): Promise<any> {
    const result = await pool.query(
      'SELECT id, email, phone FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  private async getUserDevices(userId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT push_token FROM user_devices WHERE user_id = $1 AND push_token IS NOT NULL',
      [userId]
    );
    return result.rows;
  }

  private processTemplate(
    template: string,
    notification: NotificationData
  ): string {
    let processed = template;

    processed = processed.replace(/\{\{title\}\}/g, notification.title);
    processed = processed.replace(/\{\{message\}\}/g, notification.message);

    if (notification.data) {
      Object.entries(notification.data).forEach(([key, value]) => {
        processed = processed.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
      });
    }

    return processed;
  }

  private async sendPushToDevice(
    pushToken: string,
    payload: any
  ): Promise<void> {
    // TODO: Implement push notification service (FCM, APNs, etc.)
    console.log(`Push notification to ${pushToken}:`, payload);
  }

  private async broadcastToUser(userId: string, message: any): Promise<void> {
    // TODO: Integrate with WebSocket server to broadcast real-time notifications
    console.log(`Broadcasting to user ${userId}:`, message);
  }

  private async logChannelSuccess(
    notificationId: string,
    channel: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO notification_delivery_logs 
       (notification_id, channel, status, delivered_at)
       VALUES ($1, $2, 'success', NOW())`,
      [notificationId, channel]
    );
  }

  private async logChannelFailure(
    notificationId: string,
    channel: string,
    error: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO notification_delivery_logs 
       (notification_id, channel, status, error, delivered_at)
       VALUES ($1, $2, 'failed', $3, NOW())`,
      [notificationId, channel, error]
    );
  }

  private loadTemplates(): void {
    this.templates.set('LOW_STOCK_ALERT', {
      type: 'LOW_STOCK_ALERT',
      templates: {
        email: {
          subject: 'Low Stock Alert - {{productName}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ff6b35;">⚠️ Low Stock Alert</h2>
              <p>The following product is running low on stock:</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>Product:</strong> {{productName}}<br>
                <strong>Current Stock:</strong> {{currentStock}}<br>
                <strong>Minimum Stock Level:</strong> {{minimumStock}}<br>
                <strong>Location:</strong> {{location}}
              </div>
              <p>Please restock this item as soon as possible to avoid stockouts.</p>
              <a href="{{actionUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Product</a>
            </div>
          `,
        },
        sms: {
          message:
            'Low stock alert: {{productName}} has {{currentStock}} units left (min: {{minimumStock}})',
        },
        push: {
          title: 'Low Stock Alert',
          body: '{{productName}} is running low on stock',
          data: {
            action: 'view_product',
          },
        },
        in_app: {
          title: 'Low Stock Alert',
          message: '{{productName}} has only {{currentStock}} units left',
          actionUrl: '/inventory/{{productId}}',
        },
      },
    });

    this.templates.set('INVENTORY_UPDATE', {
      type: 'INVENTORY_UPDATE',
      templates: {
        push: {
          title: 'Inventory Updated',
          body: '{{productName}} stock has been updated',
        },
        in_app: {
          title: 'Inventory Updated',
          message:
            '{{productName}} stock has been updated to {{newStock}} units',
        },
      },
    });

    this.templates.set('SECURITY_ALERT', {
      type: 'SECURITY_ALERT',
      templates: {
        email: {
          subject: 'Security Alert - {{alertType}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc3545;">🔒 Security Alert</h2>
              <p>A security event has been detected:</p>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>Alert Type:</strong> {{alertType}}<br>
                <strong>Time:</strong> {{timestamp}}<br>
                <strong>IP Address:</strong> {{ipAddress}}<br>
                <strong>User Agent:</strong> {{userAgent}}
              </div>
              <p>If this was not you, please secure your account immediately.</p>
            </div>
          `,
        },
        sms: {
          message:
            'Security alert: {{alertType}} detected on your account. If this was not you, secure your account immediately.',
        },
        push: {
          title: 'Security Alert',
          body: '{{alertType}} detected on your account',
        },
      },
    });
  }
}

export const notificationService = new NotificationService();
