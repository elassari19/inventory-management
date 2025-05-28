import { gql } from '@apollo/client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../lib/apollo';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Types
export interface NotificationData {
  id: string;
  tenantId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  read: boolean;
  timestamp: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  tenantId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  categories: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  tenantId: string;
  userId?: string;
  read?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

// GraphQL Queries
const GET_NOTIFICATIONS = gql`
  query GetNotifications($filters: NotificationFilters!) {
    notifications(filters: $filters) {
      id
      tenantId
      userId
      type
      title
      message
      data
      channels
      read
      timestamp
      expiresAt
    }
  }
`;

const GET_UNREAD_COUNT = gql`
  query GetUnreadCount($tenantId: String!, $userId: String) {
    unreadNotificationCount(tenantId: $tenantId, userId: $userId)
  }
`;

const GET_NOTIFICATION_PREFERENCES = gql`
  query GetNotificationPreferences($tenantId: String!, $userId: String!) {
    notificationPreferences(tenantId: $tenantId, userId: $userId) {
      id
      userId
      tenantId
      emailEnabled
      smsEnabled
      pushEnabled
      inAppEnabled
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
      categories
      createdAt
      updatedAt
    }
  }
`;

// GraphQL Mutations
const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($notificationIds: [String!]!) {
    markNotificationsRead(notificationIds: $notificationIds)
  }
`;

const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences(
    $preferences: NotificationPreferencesInput!
  ) {
    updateNotificationPreferences(preferences: $preferences) {
      id
      userId
      tenantId
      emailEnabled
      smsEnabled
      pushEnabled
      inAppEnabled
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
      categories
      createdAt
      updatedAt
    }
  }
`;

const SUBSCRIBE_TO_NOTIFICATIONS = gql`
  subscription OnNewNotification($tenantId: String!, $userId: String) {
    notificationAdded(tenantId: $tenantId, userId: $userId) {
      id
      tenantId
      userId
      type
      title
      message
      data
      channels
      read
      timestamp
      expiresAt
    }
  }
`;

// Notification Service Class
class NotificationService {
  private listeners: ((notification: NotificationData) => void)[] = [];
  private subscription: any = null;
  private expoPushToken: string | null = null;

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });
      this.expoPushToken = token.data;

      // Store token locally
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

      console.log(
        'Notification service initialized with token:',
        this.expoPushToken
      );
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Get notifications
  async getNotifications(
    filters: NotificationFilters
  ): Promise<NotificationData[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATIONS,
        variables: { filters },
        fetchPolicy: 'network-only',
      });

      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(tenantId: string, userId?: string): Promise<number> {
    try {
      const { data } = await apolloClient.query({
        query: GET_UNREAD_COUNT,
        variables: { tenantId, userId },
        fetchPolicy: 'network-only',
      });

      return data.unreadNotificationCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      await apolloClient.mutate({
        mutation: MARK_NOTIFICATIONS_READ,
        variables: { notificationIds },
      });

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  // Get notification preferences
  async getPreferences(
    tenantId: string,
    userId: string
  ): Promise<NotificationPreferences | null> {
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATION_PREFERENCES,
        variables: { tenantId, userId },
        fetchPolicy: 'network-only',
      });

      return data.notificationPreferences;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_NOTIFICATION_PREFERENCES,
        variables: { preferences },
      });

      return data.updateNotificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return null;
    }
  }

  // Add notification listener
  addListener(callback: (notification: NotificationData) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(tenantId: string, userId?: string): () => void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = apolloClient
      .subscribe({
        query: SUBSCRIBE_TO_NOTIFICATIONS,
        variables: { tenantId, userId },
      })
      .subscribe({
        next: ({ data }) => {
          if (data?.notificationAdded) {
            const notification = data.notificationAdded;

            // Notify all listeners
            this.listeners.forEach((listener) => listener(notification));

            // Show local notification if app is in background
            this.showLocalNotification(notification);
          }
        },
        error: (error) => {
          console.error('Notification subscription error:', error);
        },
      });

    return () => {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    };
  }

  // Show local notification
  private async showLocalNotification(
    notification: NotificationData
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Get push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Register device for push notifications
  async registerDevice(tenantId: string, userId: string): Promise<boolean> {
    if (!this.expoPushToken) {
      console.warn('No push token available');
      return false;
    }

    try {
      // You would typically send this to your backend
      // For now, we'll just store it locally
      const deviceInfo = {
        token: this.expoPushToken,
        platform: Platform.OS,
        tenantId,
        userId,
        registeredAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        'deviceRegistration',
        JSON.stringify(deviceInfo)
      );
      console.log('Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clean up
  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export service class for testing
export { NotificationService };
