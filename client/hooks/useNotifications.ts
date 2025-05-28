import { useState, useEffect, useCallback } from 'react';
import {
  notificationService,
  NotificationData,
} from '../services/notification.service';

interface UseNotificationsProps {
  tenantId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications({
  tenantId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseNotificationsProps): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notifications from server
  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await notificationService.getNotifications({
        tenantId,
        limit: 50,
      });
      setNotifications(data);

      const count = await notificationService.getUnreadCount(tenantId);
      setUnreadCount(count);

      // Update badge count
      await notificationService.setBadgeCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    await loadNotifications();
  }, [loadNotifications]);

  // Mark notifications as read
  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      try {
        await notificationService.markAsRead(notificationIds);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        const readCount = notifications.filter(
          (n) => notificationIds.includes(n.id) && !n.read
        ).length;

        setUnreadCount((prev) => {
          const newCount = Math.max(0, prev - readCount);
          notificationService.setBadgeCount(newCount);
          return newCount;
        });
      } catch (err) {
        console.error('Error marking notifications as read:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to mark notifications as read'
        );
      }
    },
    [notifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Handle new notifications from real-time updates
  const handleNewNotification = useCallback(
    (notification: NotificationData) => {
      setNotifications((prev) => {
        // Check if notification already exists
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          return prev;
        }

        // Add new notification to the beginning
        return [notification, ...prev];
      });

      if (!notification.read) {
        setUnreadCount((prev) => {
          const newCount = prev + 1;
          notificationService.setBadgeCount(newCount);
          return newCount;
        });
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadNotifications();
    }
  }, [tenantId, loadNotifications]);

  // Set up real-time notification listener
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = notificationService.addListener(handleNewNotification);
    return unsubscribe;
  }, [tenantId, handleNewNotification]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !tenantId) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, tenantId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };
}

// Hook for notification preferences
interface UseNotificationPreferencesProps {
  tenantId: string;
}

interface UseNotificationPreferencesReturn {
  preferences: any | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: any) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export function useNotificationPreferences({
  tenantId,
}: UseNotificationPreferencesProps): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      setError(null);
      // Need both tenantId and userId for getPreferences
      const prefs = await notificationService.getPreferences(
        tenantId,
        'current-user-id'
      );
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load preferences'
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: any) => {
    try {
      setError(null);
      const updated = await notificationService.updatePreferences(
        newPreferences
      );
      if (updated) {
        setPreferences(updated);
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update preferences'
      );
      throw err;
    }
  }, []);

  // Refresh preferences
  const refreshPreferences = useCallback(async () => {
    setLoading(true);
    await loadPreferences();
  }, [loadPreferences]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      loadPreferences();
    }
  }, [tenantId, loadPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refreshPreferences,
  };
}

// Hook for initializing notification service
interface UseNotificationServiceProps {
  tenantId?: string;
  deviceId?: string;
}

export function useNotificationService({
  tenantId,
  deviceId,
}: UseNotificationServiceProps = {}) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId && deviceId) {
      initializeService();
    }
  }, [tenantId, deviceId]);

  const initializeService = async () => {
    try {
      setError(null);
      await notificationService.initialize();
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing notification service:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize notifications'
      );
    }
  };

  return {
    initialized,
    error,
    notificationService,
  };
}
