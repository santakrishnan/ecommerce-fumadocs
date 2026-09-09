import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const isDev = process.env.NODE_ENV === "development";

/**
 * Guard for all `/debug/*` tooling. These routes exist only for local
 * development inspection and must never be reachable in a deployed build, so
 * anything but development renders the 404 page.
 *
 * Placing the guard in the layout means every current and future debug route
 * inherits it — individual pages don't repeat the check. Note this gates the
 * routes on development only; trace capture itself is a separate opt-in flag
 * (AGENT_DEBUG_ENABLED), so old captures stay viewable after capture is off.
 */
export default function DebugLayout({ children }: { children: ReactNode }) {
  if (!isDev) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8 text-text-primary">
      <header className="flex flex-col gap-1 border-divider border-b pb-4">
        <p className="text-text-secondary text-xs uppercase tracking-wide">Dev tools</p>
        <h1 className="font-bold text-2xl">Debug</h1>
      </header>
      {children}
    </div>
  );
}
