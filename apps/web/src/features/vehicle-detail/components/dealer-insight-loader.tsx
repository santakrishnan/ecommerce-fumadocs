import "server-only";

import type { DealerInsightResponse } from "@features/vehicle-detail/bff";
import { getDealerInsight } from "@features/vehicle-detail/bff";
import { Skeleton } from "@ucmp/ui";
import { DealerInfoDialog } from "./dealer-info-dialog";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DealerInsightLoaderProps {
  /** Dealer code to fetch insight data for. */
  dealerCode: string;
  /** Trace ID for upstream correlation. */
  traceId: string;
  /** The trigger element for the DealerInfoDialog (passed through). */
  trigger: React.ReactElement;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Skeleton matching the dealer availability trigger dimensions in the purchase card.
 * Shown while the dealer insight fetch streams in via its own <Suspense> boundary.
 */
export function DealerInsightSkeleton() {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-xl">
      {/* Mobile: single line skeleton */}
      <div className="inline-flex items-end gap-1 lg:hidden">
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Desktop: name + address + map thumbnail */}
      <div className="hidden flex-col gap-1 lg:flex">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="hidden size-16 shrink-0 rounded-xl lg:block" />
    </div>
  );
}

// ─── Async Leaf Component ─────────────────────────────────────────────────────

/**
 * Dedicated async Server Component that fetches dealer insight independently.
 *
 * This component is rendered inside its own <Suspense> boundary so the dealer
 * insight fetch does not block the rest of the VDP page stream (PPR streaming).
 * The fetched data is passed as `initialData` to DealerInfoDialog so the
 * useDealerInsight hook cache is pre-seeded and the modal opens instantly.
 */
export async function DealerInsightLoader({
  dealerCode,
  traceId,
  trigger,
}: DealerInsightLoaderProps) {
  let initialData: DealerInsightResponse | undefined;

  try {
    const result = await getDealerInsight({ dealerCode, traceId });
    if (result.success) {
      initialData = result.data;
    }
  } catch {
    // Graceful degradation — dialog will fetch client-side on open
  }

  return <DealerInfoDialog dealerCode={dealerCode} initialData={initialData} trigger={trigger} />;
}
