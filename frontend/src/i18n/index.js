import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './resources/en/common.json';
import trCommon from './resources/tr/common.json';
import enAuth from './resources/en/auth.json';
import trAuth from './resources/tr/auth.json';
import enDashboard from './resources/en/dashboard.json';
import trDashboard from './resources/tr/dashboard.json';
import enSession from './resources/en/session.json';
import trSession from './resources/tr/session.json';
import enErrors from './resources/en/errors.json';
import trErrors from './resources/tr/errors.json';
import enHome from './resources/en/home.json';
import trHome from './resources/tr/home.json';
import enCamera from './resources/en/camera.json';
import trCamera from './resources/tr/camera.json';
import enNotifications from './resources/en/notifications.json';
import trNotifications from './resources/tr/notifications.json';
import enQrscanner from './resources/en/qrscanner.json';
import trQrscanner from './resources/tr/qrscanner.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    session: enSession,
    errors: enErrors,
    home: enHome,
    camera: enCamera,
    notifications: enNotifications,
    qrscanner: enQrscanner,
  },
  tr: {
    common: trCommon,
    auth: trAuth,
    dashboard: trDashboard,
    session: trSession,
    errors: trErrors,
    home: trHome,
    camera: trCamera,
    notifications: trNotifications,
    qrscanner: trQrscanner,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'session', 'errors', 'home', 'camera', 'notifications', 'qrscanner'],
    
    detection: {
      order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'], // dev mode
    },
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    react: {
      useSuspense: false, // We'll handle loading states manually
    },
    
    initImmediate: false, // Initialize synchronously
    
    // Development settings
    debug: process.env.NODE_ENV === 'development',
    
    // Optimization settings
    load: 'languageOnly', // Load only 'en' instead of 'en-US'
    preload: ['en', 'tr'], // Preload both languages
  });

export default i18n;