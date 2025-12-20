'use client';

import { useEffect } from 'react';
import '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n is initialized in the import
  }, []);

  return <>{children}</>;
}

