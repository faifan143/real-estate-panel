'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './ui/language-switcher';

export function Navbar() {
  const { role, clearAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!role) return null;

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg">
            {t('nav.realEstatePanel')}
          </Link>

          <div className="flex gap-4">
            {role === 'ADMIN' ? (
              <>
                <Link href="/admin/requests" className="text-sm hover:underline">
                  {t('nav.adminRequests')}
                </Link>
                <Link href="/properties" className="text-sm hover:underline">
                  {t('nav.properties')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/properties" className="text-sm hover:underline">
                  {t('nav.properties')}
                </Link>
                <Link href="/my-properties" className="text-sm hover:underline">
                  {t('nav.myProperties')}
                </Link>
                <Link href="/my-requests" className="text-sm hover:underline">
                  {t('nav.myRequests')}
                </Link>
                <Link href="/my-meetings" className="text-sm hover:underline">
                  {t('nav.myMeetings')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="outline" onClick={handleLogout} size="sm">
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </nav>
  );
}
