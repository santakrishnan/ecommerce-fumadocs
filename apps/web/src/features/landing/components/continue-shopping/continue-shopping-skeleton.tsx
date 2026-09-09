import { CardCarouselSkeleton } from "@shared/components/card";
import { Skeleton } from "@ucmp/ui";

interface ContinueShoppingSkeletonProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
}

/**
 * Skeleton fallback for the Continue Shopping section.
 *
 * Uses shape-only placeholders (no text) to avoid flashing real copy
 * ("Pick up where you left off...") that vanishes when the section
 * returns null for visitors with empty history.
 */
export function ContinueShoppingSkeleton({ className }: ContinueShoppingSkeletonProps = {}) {
  return (
    <section
      aria-busy="true"
      aria-label="Loading continue shopping"
      className={className}
      role="status"
    >
      <div className="mb-4">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="mt-2 h-4 w-80 rounded" />
      </div>
      <CardCarouselSkeleton count={6} size="sm" />
    </section>
  );
}
