"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Re-runs the server component for the current route via `router.refresh()`,
 * re-reading the captured traces without a full document reload. This avoids
 * the hard-refresh cost of Next dev recompiling the whole app on navigation.
 */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      className="rounded border border-divider px-3 py-1 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
      disabled={isPending}
      onClick={handleRefresh}
      type="button"
    >
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
