import { IconLocation } from "@ucmp/ui/icons";

/**
 * Non-interactive placeholder matching LocationPill's exact dimensions
 * (h-14 min-w-26 pill) so the swap to the real pill causes no layout shift.
 *
 * Server-safe (no "use client") — used both as the PPR Suspense fallback in
 * the header and by LocationPill itself while no location has resolved yet
 * (first visit, fingerprint enrichment still in flight).
 */
export function LocationPillSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-14 min-w-26 items-center justify-center gap-2 rounded-full bg-(--btn-secondary-bg) px-6"
      data-testid="location-pill-skeleton"
    >
      <IconLocation aria-hidden="true" className="size-4 text-(--btn-secondary-text) opacity-60" />
      <span className="h-3.5 w-10 animate-pulse rounded-sm bg-(--btn-secondary-text)/20" />
    </span>
  );
}
