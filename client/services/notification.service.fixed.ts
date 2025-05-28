import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apolloClient } from '../lib/apollo';
import { gql } from '@apollo/client';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  categories: Record<string, Record<string, boolean>>;
}

// GraphQL mutations and queries
const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken(
    $deviceId: ID!
    $pushToken: String!
    $platform: PushPlatform!
  ) {
    registerPushToken(
      deviceId: $deviceId
      pushToken: $pushToken
      platform: $platform
    )
  }
`;

const GET_NOTIFICATIONS = gql`
  query GetNotifications(
    $tenantId: ID!
    $channel: NotificationChannel
    $type: String
    $status: NotificationStatus
    $limit: Int
    $offset: Int
  ) {
    notifications(
      tenantId: $tenantId
      channel: $channel
      type: $type
      status: $status
      limit: $limit
      offset: $offset
    ) {
      id
      type
      title
      message
      data
      priority
      status
      readAt
      createdAt
      expiresAt
    }
  }
`;

const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount($tenantId: ID!) {
    unreadNotificationCount(tenantId: $tenantId)
  }
`;

const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($notificationIds: [ID!]!) {
    markNotificationsRead(notificationIds: $notificationIds)
  }
`;

const GET_NOTIFICATION_PREFERENCES = gql`
  query GetNotificationPreferences($tenantId: ID!) {
    notificationPreferences(tenantId: $tenantId) {
      emailEnabled
      smsEnabled
      pushEnabled
      inAppEnabled
      quietHoursStart
      quietHoursEnd
      timezone
      categories
    }
  }
`;

const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences(
    $tenantId: ID!
    $preferences: NotificationPreferencesInput!
  ) {
    updateNotificationPreferences(
      tenantId: $tenantId
      preferences: $preferences
    ) {
      emailEnabled
      smsEnabled
      pushEnabled
      inAppEnabled
      quietHoursStart
      quietHoursEnd
      timezone
      categories
    }
  }
`;

// Notification subscription
const NOTIFICATION_SUBSCRIPTION = gql`
  subscription NotificationReceived($tenantId: ID!) {
    notificationReceived(tenantId: $tenantId) {
      id
      type
      title
      message
      data
      priority
      timestamp
    }
  }
`;

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private deviceId: string | null = null;
  private currentTenantId: string | null = null;
  private listeners: ((notification: NotificationData) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification system
   */
  async initialize(tenantId: string, deviceId: string): Promise<void> {
    this.currentTenantId = tenantId;
    this.deviceId = deviceId;

    // Configure notification behavior
    await this.configureNotifications();

    // Request permissions and get push token
    await this.requestPermissions();

    // Set up notification listeners
    this.setupNotificationListeners();

    // Subscribe to real-time notifications
    this.subscribeToNotifications(tenantId);
  }

  /**
   * Configure notification behavior for the app
   */
  private async configureNotifications(): Promise<void> {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('low-stock', {
        name: 'Low Stock Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        description: 'Notifications for low stock alerts',
      });

      await Notifications.setNotificationChannelAsync('security', {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC3545',
        description: 'Security-related notifications',
      });
    }
  }

  /**
   * Request notification permissions and get push token
   */
  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    // Get the push token
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = pushTokenData.data;

      // Register the token with the server
      if (this.deviceId && this.expoPushToken) {
        await this.registerPushToken(this.deviceId, this.expoPushToken);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  /**
   * Register push token with the server
   */
  private async registerPushToken(
    deviceId: string,
    pushToken: string
  ): Promise<void> {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      await apolloClient.mutate({
        mutation: REGISTER_PUSH_TOKEN,
        variables: {
          deviceId,
          pushToken,
          platform: platform.toUpperCase(),
        },
      });

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      const notificationData: NotificationData = {
        id: notification.request.identifier,
        type: (notification.request.content.data?.type as string) || 'unknown',
        title: notification.request.content.title || '',
        message: notification.request.content.body || '',
        data: notification.request.content.data,
        timestamp: new Date().toISOString(),
        read: false,
      };

      this.notifyListeners(notificationData);
    });

    // Listener for when a notification is tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      const notificationData: NotificationData = {
        id: response.notification.request.identifier,
        type:
          (response.notification.request.content.data?.type as string) ||
          'unknown',
        title: response.notification.request.content.title || '',
        message: response.notification.request.content.body || '',
        data: response.notification.request.content.data,
        timestamp: new Date().toISOString(),
        read: true,
      };

      this.handleNotificationTap(notificationData);
    });
  }

  /**
   * Handle notification tap events
   */
  private handleNotificationTap(notification: NotificationData): void {
    // Mark notification as read
    this.markAsRead([notification.id]);

    // Handle navigation based on notification type
    const { type, data } = notification;

    switch (type) {
      case 'LOW_STOCK_ALERT':
        // Navigate to inventory item
        if (data?.itemId) {
          // TODO: Implement navigation to inventory item
          console.log('Navigate to inventory item:', data.itemId);
        }
        break;
      case 'SECURITY_ALERT':
        // Navigate to security logs
        console.log('Navigate to security logs');
        break;
      case 'INVENTORY_UPDATE':
        // Navigate to inventory
        console.log('Navigate to inventory');
        break;
      default:
        // Navigate to notifications list
        console.log('Navigate to notifications');
    }

    this.notifyListeners(notification);
  }

  /**
   * Subscribe to real-time notifications
   */
  private subscribeToNotifications(tenantId: string): void {
    try {
      // TODO: Implement GraphQL subscription for real-time notifications
      console.log('Subscribing to notifications for tenant:', tenantId);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  /**
   * Get notifications from the server
   */
  async getNotifications(options: {
    tenantId: string;
    channel?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationData[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATIONS,
        variables: options,
        fetchPolicy: 'network-only',
      });

      return data.notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notification.createdAt,
        read: !!notification.readAt,
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(tenantId: string): Promise<number> {
    try {
      const { data } = await apolloClient.query({
        query: GET_UNREAD_COUNT,
        variables: { tenantId },
      });

      return data.unreadNotificationCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await apolloClient.mutate({
        mutation: MARK_NOTIFICATIONS_READ,
        variables: { notificationIds },
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(
    tenantId: string
  ): Promise<NotificationPreferences | null> {
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATION_PREFERENCES,
        variables: { tenantId },
        fetchPolicy: 'network-only',
      });

      return data.notificationPreferences;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    tenantId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_NOTIFICATION_PREFERENCES,
        variables: { tenantId, preferences },
      });

      return data.updateNotificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return null;
    }
  }

  /**
   * Send a local notification
   */
  async sendLocalNotification(
    title: string,
    message: string,
    data?: Record<string, any>,
    channelId: string = 'default'
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Add a notification listener
   */
  addListener(listener: (notification: NotificationData) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of a new notification
   */
  private notifyListeners(notification: NotificationData): void {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.listeners = [];
    this.expoPushToken = null;
    this.deviceId = null;
    this.currentTenantId = null;
  }
}

export const notificationService = NotificationService.getInstance();
