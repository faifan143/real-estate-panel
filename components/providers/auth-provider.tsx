'use client';

import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { setClearAuthCallback } from '@/lib/axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize auth from localStorage
    initAuth();

    // When session expires (401), clear query cache then auth so next user sees no stale data
    setClearAuthCallback(() => {
      queryClient.clear();
      clearAuth();
    });
  }, [initAuth, clearAuth, queryClient]);

  return <>{children}</>;
}
