'use client';

import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { setClearAuthCallback } from '@/lib/axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    // Initialize auth from localStorage
    initAuth();
    
    // Set callback for axios interceptor to clear auth state
    setClearAuthCallback(clearAuth);
  }, [initAuth, clearAuth]);

  return <>{children}</>;
}
