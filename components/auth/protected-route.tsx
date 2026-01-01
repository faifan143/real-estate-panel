'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'USER' | 'ADMIN';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { token, role, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be initialized before checking
    if (!isInitialized) {
      return;
    }

    // If no token after initialization, redirect to login
    if (!token) {
      router.push('/login');
      return;
    }

    // Check role requirement
    if (requireRole && role !== requireRole) {
      router.push('/properties');
    }
  }, [token, role, requireRole, router, isInitialized]);

  // Show loading spinner while auth is being initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show nothing if no token (redirect will happen)
  if (!token) {
    return null;
  }

  // Show nothing if role doesn't match (redirect will happen)
  if (requireRole && role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
