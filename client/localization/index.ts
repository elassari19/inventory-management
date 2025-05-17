import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translations
import ar from './translations/ar.json';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';

// Create the i18n instance
const i18n = new I18n({
  ar,
  en,
  es,
  fr,
});

// Set the locale once at the beginning of your app
// Handle the case when getLocales returns an empty array
let deviceLanguage = 'en';
try {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0 && locales[0].languageCode) {
    deviceLanguage = locales[0].languageCode;
  }
} catch (error) {
  console.warn('Error getting device locale:', error);
}

i18n.locale = deviceLanguage;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Helper function for translations
const t = (key: string, params = {}) => {
  return i18n.t(key, params);
};

export { i18n, t };
