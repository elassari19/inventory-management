import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { i18n, t } from '../localization';

const LANGUAGE_KEY = '@app_language';

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (language: string) => {
    i18n.locale = language;
    setCurrentLanguage(language);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const getCurrentLanguage = () => {
    return currentLanguage;
  };

  const getAvailableLanguages = () => {
    return Object.keys(i18n.translations);
  };

  // Get device's preferred languages
  const getDeviceLanguage = () => {
    return Localization.getLocales()[0].languageCode;
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    getDeviceLanguage,
  };
}
