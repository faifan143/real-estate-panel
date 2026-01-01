'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import axios from 'axios';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Keep previous data when query refetches to prevent flickering
            placeholderData: (previousData: unknown) => previousData,
            retry: (failureCount, error) => {
              // Don't retry on 401 (unauthorized) or 403 (forbidden) errors
              if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                  return false;
                }
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry mutations on 401 or 403 errors
              if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                  return false;
                }
              }
              return false; // Don't retry mutations by default
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
