import { gql } from 'apollo-server-express';
import { NotificationService } from '../services/notification.service';
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from 'apollo-server-express';

export const typeDefs = gql`
  extend type Query {
    # Get notifications for the current user
    notifications(
      tenantId: ID!
      channel: NotificationChannel
      type: String
      status: NotificationStatus
      limit: Int
      offset: Int
    ): [Notification!]!

    # Get unread notification count
    unreadNotificationCount(tenantId: ID!): Int!

    # Get user's notification preferences
    notificationPreferences(tenantId: ID!): NotificationPreferences!

    # Get notification templates (admin only)
    notificationTemplates(tenantId: ID, type: String): [NotificationTemplate!]!
  }

  extend type Mutation {
    # Send a notification
    sendNotification(input: SendNotificationInput!): Notification!

    # Mark notifications as read
    markNotificationsRead(notificationIds: [ID!]!): Boolean!

    # Update notification preferences
    updateNotificationPreferences(
      tenantId: ID!
      preferences: NotificationPreferencesInput!
    ): NotificationPreferences!

    # Create/update notification template (admin only)
    createNotificationTemplate(
      input: NotificationTemplateInput!
    ): NotificationTemplate!
    updateNotificationTemplate(
      id: ID!
      input: NotificationTemplateInput!
    ): NotificationTemplate!

    # Delete notification template (admin only)
    deleteNotificationTemplate(id: ID!): Boolean!

    # Register device for push notifications
    registerPushToken(
      deviceId: ID!
      pushToken: String!
      platform: PushPlatform!
    ): Boolean!
  }

  extend type Subscription {
    # Subscribe to new notifications for a user
    notificationReceived(tenantId: ID!): Notification!
  }

  # Core notification types
  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    data: JSON
    channels: [NotificationChannel!]!
    priority: NotificationPriority!
    status: NotificationStatus!
    tenantId: ID!
    userId: ID!
    readAt: String
    expiresAt: String
    scheduledFor: String
    createdAt: String!
    updatedAt: String!
  }

  type NotificationPreferences {
    userId: ID!
    tenantId: ID!
    emailEnabled: Boolean!
    smsEnabled: Boolean!
    pushEnabled: Boolean!
    inAppEnabled: Boolean!
    quietHoursStart: String
    quietHoursEnd: String
    timezone: String
    categories: [NotificationCategoryPreference!]!
    createdAt: String!
    updatedAt: String!
  }

  type NotificationCategoryPreference {
    category: String!
    channels: [NotificationChannel!]!
    enabled: Boolean!
  }

  type NotificationTemplate {
    id: ID!
    type: String!
    channel: NotificationChannel!
    template: JSON!
    tenantId: ID
    active: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  # Input types
  input SendNotificationInput {
    type: String!
    title: String!
    message: String!
    data: JSON
    channels: [NotificationChannel!]!
    priority: NotificationPriority = medium
    tenantId: ID!
    userId: ID
    userIds: [ID!]
    expiresAt: String
    scheduledFor: String
  }

  input NotificationPreferencesInput {
    emailEnabled: Boolean
    smsEnabled: Boolean
    pushEnabled: Boolean
    inAppEnabled: Boolean
    quietHoursStart: String
    quietHoursEnd: String
    timezone: String
    categories: [NotificationCategoryPreferenceInput!]
  }

  input NotificationCategoryPreferenceInput {
    category: String!
    channels: [NotificationChannel!]!
    enabled: Boolean!
  }

  input NotificationTemplateInput {
    type: String!
    channel: NotificationChannel!
    template: JSON!
    tenantId: ID
    active: Boolean
  }

  # Enums
  enum NotificationChannel {
    email
    sms
    push
    in_app
  }

  enum NotificationPriority {
    low
    medium
    high
    urgent
  }

  enum NotificationStatus {
    pending
    sent
    delivered
    failed
    read
  }

  enum PushPlatform {
    ios
    android
    web
  }
`;

export const resolvers = {
  Query: {
    notifications: async (
      _,
      { tenantId, channel, type, status, limit = 20, offset = 0 },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.getNotifications({
          tenantId,
          userId: user.id,
          channel,
          type,
          status,
          limit,
          offset,
        });
      } catch (error) {
        throw new UserInputError(
          'Failed to fetch notifications: ' + error.message
        );
      }
    },

    unreadNotificationCount: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.getUnreadCount(tenantId, user.id);
      } catch (error) {
        throw new UserInputError(
          'Failed to fetch unread count: ' + error.message
        );
      }
    },

    notificationPreferences: async (_, { tenantId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.getPreferences(tenantId, user.id);
      } catch (error) {
        throw new UserInputError(
          'Failed to fetch preferences: ' + error.message
        );
      }
    },

    notificationTemplates: async (_, { tenantId, type }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.getTemplates(tenantId, type);
      } catch (error) {
        throw new UserInputError('Failed to fetch templates: ' + error.message);
      }
    },
  },

  Mutation: {
    sendNotification: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.sendNotification({
          ...input,
          userId: input.userId || user.id,
          userIds: input.userIds || [user.id],
        });
      } catch (error) {
        throw new UserInputError(
          'Failed to send notification: ' + error.message
        );
      }
    },

    markNotificationsRead: async (_, { notificationIds }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        await notificationService.markAsRead(notificationIds, user.id);
        return true;
      } catch (error) {
        throw new UserInputError(
          'Failed to mark notifications as read: ' + error.message
        );
      }
    },

    updateNotificationPreferences: async (
      _,
      { tenantId, preferences },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.updatePreferences(
          tenantId,
          user.id,
          preferences
        );
      } catch (error) {
        throw new UserInputError(
          'Failed to update preferences: ' + error.message
        );
      }
    },

    createNotificationTemplate: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.createTemplate(input);
      } catch (error) {
        throw new UserInputError('Failed to create template: ' + error.message);
      }
    },

    updateNotificationTemplate: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        return await notificationService.updateTemplate(id, input);
      } catch (error) {
        throw new UserInputError('Failed to update template: ' + error.message);
      }
    },

    deleteNotificationTemplate: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        await notificationService.deleteTemplate(id);
        return true;
      } catch (error) {
        throw new UserInputError('Failed to delete template: ' + error.message);
      }
    },

    registerPushToken: async (
      _,
      { deviceId, pushToken, platform },
      { user }
    ) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const notificationService = new NotificationService();
        await notificationService.registerPushToken(
          deviceId,
          pushToken,
          platform
        );
        return true;
      } catch (error) {
        throw new UserInputError(
          'Failed to register push token: ' + error.message
        );
      }
    },
  },

  Subscription: {
    notificationReceived: {
      // This would need to be implemented with a subscription system like Redis/GraphQL subscriptions
      subscribe: async (_, { tenantId }, { user }) => {
        if (!user) {
          throw new AuthenticationError('Not authenticated');
        }

        // Implementation would depend on your subscription system
        // This is a placeholder for the subscription logic
        return null;
      },
    },
  },
};
