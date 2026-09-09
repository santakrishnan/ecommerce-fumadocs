import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { toyotaType } from "@config/fonts";
import { AuthProvider } from "@features/auth";
import { FingerprintProvider } from "@features/fingerprint";
import { SearchExitGuard } from "@features/search/components/search-back-navigation-guard";
import { ProviderClients } from "@shared/providers";
import { composeProviders } from "@shared/providers/compose-providers";
import { MotionProvider } from "@shared/providers/motion-provider";
import { PageViewTracker } from "@shared/providers/page-view-tracker";
import { QueryProvider } from "@shared/providers/query-provider";
import { SessionKeepAlive } from "@shared/providers/session-keep-alive";
import { VercelToolbarLoader } from "@shared/providers/vercel-toolbar-loader";
import { VisitorIdentitySeeder } from "@shared/providers/visitor-identity-seeder";
import { VisitorProvider } from "@shared/providers/visitor-provider";
import { ThemeProvider } from "@ucmp/shared/providers";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  title: "Toyota",
  description:
    "Search for your next Toyota. Browse new and used cars, compare models, and find deals near you.",
};

const SyncProviders = composeProviders(
  ThemeProvider,
  QueryProvider,
  MotionProvider,
  FingerprintProvider,
  VisitorProvider,
  AuthProvider
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={toyotaType.variable} lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <SyncProviders>
          <Suspense>
            <SearchExitGuard />
          </Suspense>
          <Suspense fallback={null}>
            <SessionKeepAlive />
          </Suspense>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <Suspense fallback={null}>
            <VisitorIdentitySeeder />
          </Suspense>
          <Suspense fallback={null}>
            <VercelToolbarLoader />
          </Suspense>
          <Suspense>
            <ProviderClients>{children}</ProviderClients>
          </Suspense>
        </SyncProviders>
        {IS_PRODUCTION && <Analytics />}
        {IS_PRODUCTION && <SpeedInsights />}
      </body>
    </html>
  );
}
