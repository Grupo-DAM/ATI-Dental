import i18n, { LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_KEY = 'user-language';

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage) {
        return callback(storedLanguage);
      }
    } catch (error) {
      console.error('Error reading language from AsyncStorage', error);
    }
    
    // Fallback a idioma del sistema
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      if (languageCode === 'en') {
        return callback('en');
      }
    }
    
    // Por defecto (fallback) en caso de francés u otros
    callback('es');
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Error saving language to AsyncStorage', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React escapa valores por defecto
    },
    compatibilityJSON: 'v4', // Recomendado para React Native
  });

export default i18n;
