"use client";

import { HeroTransitionProvider as SharedHeroTransitionProvider } from "@shared/components/shared-hero-transition";
import { Toaster } from "@ucmp/ui";
import type { ReactNode } from "react";

interface ProviderClientsProps {
  children: ReactNode;
}

/**
 * Client-side providers that add capabilities beyond the base SyncProviders.
 * SyncProviders (in layout.tsx) already handles ThemeProvider, QueryProvider,
 * MotionProvider, and FingerprintProvider. This wrapper adds only:
 * - HeroTransitionProvider (forward card → VDP animation)
 * - Toaster (toast notifications)
 */
export function ProviderClients({ children }: ProviderClientsProps) {
  return (
    <SharedHeroTransitionProvider>
      {children}
      <Toaster position="top-center" richColors />
    </SharedHeroTransitionProvider>
  );
}
