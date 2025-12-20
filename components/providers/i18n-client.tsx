'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function I18nClient({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update HTML lang and dir attributes when language changes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language || 'en';
      document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n.language]);

  return <>{children}</>;
}

