import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  notificationService,
  NotificationData,
} from '../../services/notification.service';

interface NotificationListProps {
  tenantId: string;
  onNotificationPress?: (notification: NotificationData) => void;
}

export function NotificationList({
  tenantId,
  onNotificationPress,
}: NotificationListProps) {
  const colorScheme = useColorScheme();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({
        tenantId,
        limit: 50,
      });
      setNotifications(data);

      const count = await notificationService.getUnreadCount(tenantId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen for new notifications
    const unsubscribe = notificationService.addListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [tenantId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Handle notification press
  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.read) {
      await notificationService.markAsRead([notification.id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    onNotificationPress?.(notification);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await notificationService.markAsRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'LOW_STOCK_ALERT':
        return 'warning-outline';
      case 'INVENTORY_UPDATE':
        return 'cube-outline';
      case 'SECURITY_ALERT':
        return 'shield-outline';
      default:
        return priority === 'urgent'
          ? 'alert-circle-outline'
          : 'notifications-outline';
    }
  };

  // Get notification color
  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return '#DC3545';

    switch (type) {
      case 'LOW_STOCK_ALERT':
        return '#FF6B35';
      case 'INVENTORY_UPDATE':
        return '#007BFF';
      case 'SECURITY_ALERT':
        return '#DC3545';
      default:
        return Colors[colorScheme ?? 'light'].text;
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getNotificationIcon(
              item.type,
              item.data?.priority || 'medium'
            )}
            size={24}
            color={getNotificationColor(
              item.type,
              item.data?.priority || 'medium'
            )}
          />
          <View style={styles.notificationMeta}>
            <ThemedText style={styles.notificationTime}>
              {formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
              })}
            </ThemedText>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </View>

        <ThemedText
          style={[styles.notificationTitle, !item.read && styles.unreadText]}
        >
          {item.title}
        </ThemedText>

        <ThemedText style={styles.notificationMessage}>
          {item.message}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Notifications</ThemedText>
        {unreadCount > 0 && (
          <View style={styles.headerActions}>
            <View style={[styles.badge, { backgroundColor: '#FF6B35' }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.markAllButton,
                { borderColor: Colors[colorScheme ?? 'light'].text },
              ]}
              onPress={markAllAsRead}
            >
              <ThemedText style={styles.markAllText}>Mark all read</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors[colorScheme ?? 'light'].text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-outline"
              size={64}
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            <ThemedText style={styles.emptyText}>
              No notifications yet
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FA',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007BFF',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});
