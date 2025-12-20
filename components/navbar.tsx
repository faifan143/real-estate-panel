'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { role, clearAuth } = useAuthStore();
  const router = useRouter();

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
            Real Estate Panel
          </Link>

          <div className="flex gap-4">
            {role === 'ADMIN' ? (
              <>
                <Link href="/admin/requests" className="text-sm hover:underline">
                  Admin Requests
                </Link>
                <Link href="/properties" className="text-sm hover:underline">
                  Properties
                </Link>
              </>
            ) : (
              <>
                <Link href="/properties" className="text-sm hover:underline">
                  Properties
                </Link>
                <Link href="/my-properties" className="text-sm hover:underline">
                  My Properties
                </Link>
                <Link href="/my-requests" className="text-sm hover:underline">
                  My Requests
                </Link>
                <Link href="/my-meetings" className="text-sm hover:underline">
                  My Meetings
                </Link>
              </>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={handleLogout} size="sm">
          Logout
        </Button>
      </div>
    </nav>
  );
}
