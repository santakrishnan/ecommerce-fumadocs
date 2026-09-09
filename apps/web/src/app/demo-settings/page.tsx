import {
  DemoSettingsLoader,
  DemoSettingsNav,
  VisitorIdentityCardLoader,
} from "@features/demo-settings";
import { Skeleton } from "@ucmp/ui";
import { IconToyotaX } from "@ucmp/ui/icons";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Demo settings",
  robots: { index: false, follow: false },
};

/**
 * `/demo-settings` — demo-only configuration console.
 *
 * Ungated on purpose: the deployed demo needs to flip the agent backend at
 * runtime, and the settings hold no sensitive data — the cookie affects only
 * the requester's own session. Synchronous PPR shell; the dynamic,
 * cookie-reading body streams in behind Suspense.
 */
export default function DemoSettingsPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="mb-12 flex flex-col items-center text-center">
          <IconToyotaX className="m-2 size-10 text-brand" />
          <h1 className="h1 text-text-primary">Demo settings</h1>
          <p className="body-lg mt-4 text-text-primary">
            Runtime configuration for demos. Changes are stored in cookies scoped to your browser.
          </p>
        </header>
        <div className="flex gap-10">
          <aside className="sticky top-10 w-52 shrink-0 self-start">
            <DemoSettingsNav />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-8 px-4 [&_[data-slot=card-content]]:px-7 [&_[data-slot=card-header]]:px-7">
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
              <VisitorIdentityCardLoader />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
              <DemoSettingsLoader />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
