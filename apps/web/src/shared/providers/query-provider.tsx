"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * App-wide TanStack Query provider.
 *
 * Each browser session creates a fresh QueryClient inside useState — this
 * guarantees the client is stable across re-renders but does not leak between
 * users in SSR. Swap `QueryClientProvider` for `PersistQueryClientProvider`
 * if you want to persist a subset of queries to IndexedDB or localStorage.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep server data fresh for 30 s before refetching in background
            staleTime: 30 * 1000,
            // Keep unused query data for 5 min
            gcTime: 5 * 60 * 1000,
            // Retry once on failure then surface the error
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
