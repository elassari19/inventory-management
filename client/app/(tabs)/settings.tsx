import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SettingsScreen() {
  const { t } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        {t('common.settings')}
      </Text>
      
      <View style={styles.settingsContainer}>
        <Link href="/language-settings" asChild>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={[styles.settingText, { color: textColor }]}>
              {t('common.language')}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 30,
  },
  settingsContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 1,
  },
  settingText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    color: '#999',
  },
});
