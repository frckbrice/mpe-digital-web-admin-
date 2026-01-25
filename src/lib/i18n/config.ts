/**
 * i18next configuration for admin app
 * French as default; supports FR and EN via switcher (cookie).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/constants';

import en from '@/locales/en/common.json';
import fr from '@/locales/fr/common.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

const getInitialLanguage = (): 'en' | 'fr' => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const cookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  const c = cookie?.[1];
  if (c === 'en' || c === 'fr') return c;
  return DEFAULT_LOCALE;
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    lng: typeof window === 'undefined' ? DEFAULT_LOCALE : getInitialLanguage(),
    initImmediate: true,
  });
}

export default i18n;
