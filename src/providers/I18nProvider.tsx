'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'fr';
    const onLang = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', onLang);
    return () => {
      i18n.off('languageChanged', onLang);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
