import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  notificationService,
  NotificationPreferences,
} from '../../services/notification.service';

interface NotificationPreferencesScreenProps {
  tenantId: string;
  userId: string;
  onSave?: (preferences: NotificationPreferences) => void;
}

interface CategoryPreference {
  name: string;
  displayName: string;
  description: string;
  icon: string;
}

const NOTIFICATION_CATEGORIES: CategoryPreference[] = [
  {
    name: 'LOW_STOCK_ALERT',
    displayName: 'Low Stock Alerts',
    description: 'Get notified when inventory is running low',
    icon: 'warning-outline',
  },
  {
    name: 'INVENTORY_UPDATE',
    displayName: 'Inventory Updates',
    description: 'Stock level changes and movements',
    icon: 'cube-outline',
  },
  {
    name: 'SECURITY_ALERT',
    displayName: 'Security Alerts',
    description: 'Login attempts and security events',
    icon: 'shield-outline',
  },
  {
    name: 'SYSTEM_NOTIFICATION',
    displayName: 'System Notifications',
    description: 'App updates and maintenance notices',
    icon: 'settings-outline',
  },
];

export function NotificationPreferencesScreen({
  tenantId,
  userId,
  onSave,
}: NotificationPreferencesScreenProps) {
  const colorScheme = useColorScheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    id: '',
    userId: userId || '',
    tenantId,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    categories: {},
    createdAt: '',
    updatedAt: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current preferences
  useEffect(() => {
    loadPreferences();
  }, [tenantId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const currentPrefs = await notificationService.getPreferences(
        tenantId,
        userId
      );
      if (currentPrefs) {
        setPreferences(currentPrefs);
        initializeCategoryPreferences(currentPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  // Initialize category preferences if they don't exist
  const initializeCategoryPreferences = (prefs: NotificationPreferences) => {
    const updatedCategories = { ...prefs.categories };

    NOTIFICATION_CATEGORIES.forEach((category) => {
      if (updatedCategories[category.name] === undefined) {
        updatedCategories[category.name] = true;
      }
    });

    if (
      JSON.stringify(updatedCategories) !== JSON.stringify(prefs.categories)
    ) {
      setPreferences((prev) => ({ ...prev, categories: updatedCategories }));
    }
  };

  // Update global preference
  const updateGlobalPreference = (
    key: keyof NotificationPreferences,
    value: any
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  // Update category preference
  const updateCategoryPreference = (categoryName: string, enabled: boolean) => {
    setPreferences((prev) => {
      const updatedCategories = {
        ...prev.categories,
        [categoryName]: enabled,
      };

      setHasChanges(true);
      return { ...prev, categories: updatedCategories };
    });
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
      const saved = await notificationService.updatePreferences(preferences);
      if (saved) {
        setHasChanges(false);
        onSave?.(saved);
        Alert.alert('Success', 'Notification preferences updated');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all notification preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultPrefs: NotificationPreferences = {
              ...preferences,
              emailEnabled: true,
              smsEnabled: false,
              pushEnabled: true,
              inAppEnabled: true,
              quietHoursEnabled: false,
              quietHoursStart: '22:00',
              quietHoursEnd: '08:00',
              categories: {},
            };

            setPreferences(defaultPrefs);
            initializeCategoryPreferences(defaultPrefs);
            setHasChanges(true);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ThemedText>Loading preferences...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Global Settings */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Global Settings</ThemedText>

          <View
            style={[
              styles.preferenceRow,
              {
                borderBottomColor:
                  Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons
                name="mail-outline"
                size={24}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceName}>
                  Email Notifications
                </ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Receive notifications via email
                </ThemedText>
              </View>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={(value) =>
                updateGlobalPreference('emailEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
              thumbColor={preferences.emailEnabled ? '#FFF' : '#FFF'}
            />
          </View>

          <View
            style={[
              styles.preferenceRow,
              {
                borderBottomColor:
                  Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons
                name="chatbubble-outline"
                size={24}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceName}>
                  SMS Notifications
                </ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Receive notifications via text message
                </ThemedText>
              </View>
            </View>
            <Switch
              value={preferences.smsEnabled}
              onValueChange={(value) =>
                updateGlobalPreference('smsEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
              thumbColor={preferences.smsEnabled ? '#FFF' : '#FFF'}
            />
          </View>

          <View
            style={[
              styles.preferenceRow,
              {
                borderBottomColor:
                  Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceName}>
                  Push Notifications
                </ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Receive push notifications on this device
                </ThemedText>
              </View>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) =>
                updateGlobalPreference('pushEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
              thumbColor={preferences.pushEnabled ? '#FFF' : '#FFF'}
            />
          </View>

          <View
            style={[
              styles.preferenceRow,
              {
                borderBottomColor:
                  Colors[colorScheme ?? 'light'].tabIconDefault,
              },
            ]}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color={Colors[colorScheme ?? 'light'].text}
              />
              <View style={styles.preferenceText}>
                <ThemedText style={styles.preferenceName}>
                  In-App Notifications
                </ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Show notifications within the app
                </ThemedText>
              </View>
            </View>
            <Switch
              value={preferences.inAppEnabled}
              onValueChange={(value) =>
                updateGlobalPreference('inAppEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
              thumbColor={preferences.inAppEnabled ? '#FFF' : '#FFF'}
            />
          </View>
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Notification Categories
          </ThemedText>

          {NOTIFICATION_CATEGORIES.map((category) => (
            <View
              key={category.name}
              style={[
                styles.preferenceRow,
                {
                  borderBottomColor:
                    Colors[colorScheme ?? 'light'].tabIconDefault,
                },
              ]}
            >
              <View style={styles.preferenceInfo}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={Colors[colorScheme ?? 'light'].text}
                />
                <View style={styles.preferenceText}>
                  <ThemedText style={styles.preferenceName}>
                    {category.displayName}
                  </ThemedText>
                  <ThemedText style={styles.preferenceDescription}>
                    {category.description}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={preferences.categories[category.name] || false}
                onValueChange={(value) =>
                  updateCategoryPreference(category.name, value)
                }
                trackColor={{ false: '#E0E0E0', true: '#007BFF' }}
                thumbColor={
                  preferences.categories[category.name] ? '#FFF' : '#FFF'
                }
              />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetToDefaults}
          >
            <ThemedText style={styles.resetButtonText}>
              Reset to Defaults
            </ThemedText>
          </TouchableOpacity>

          {hasChanges && (
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={savePreferences}
              disabled={saving}
            >
              <ThemedText style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  categorySection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  categoryChannels: {
    marginLeft: 32,
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  channelName: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#DC3545',
  },
  resetButtonText: {
    color: '#DC3545',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007BFF',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
