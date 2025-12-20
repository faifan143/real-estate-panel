'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'USER' | 'ADMIN';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { token, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (requireRole && role !== requireRole) {
      router.push('/properties');
    }
  }, [token, role, requireRole, router]);

  if (!token) {
    return null;
  }

  if (requireRole && role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
