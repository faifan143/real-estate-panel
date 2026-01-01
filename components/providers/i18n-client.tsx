'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function I18nClient({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Always set to Arabic
    if (typeof document !== 'undefined') {
      i18n.changeLanguage('ar');
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }, [i18n]);

  return <>{children}</>;
}

