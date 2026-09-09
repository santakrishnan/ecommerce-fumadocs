import { CONTINUE_SHOPPING } from "@features/landing/data/continue-shopping";
import { CardCarouselSkeleton } from "@shared/components/card";
import { SectionHeader } from "@shared/components/section-header";

interface ContinueShoppingVdpSkeletonProps {
  /** Outer wrapper class. */
  className?: string;
}

/**
 * Skeleton fallback for the VDP Continue Shopping section.
 * Mirrors the real carousel layout to prevent layout shift.
 */
export function ContinueShoppingVdpSkeleton({ className }: ContinueShoppingVdpSkeletonProps = {}) {
  return (
    <section
      aria-busy="true"
      aria-label="Loading continue shopping"
      className={className}
      role="status"
    >
      <div className="mb-4">
        <SectionHeader subtitle={CONTINUE_SHOPPING.subtitle} title={CONTINUE_SHOPPING.title} />
      </div>
      <CardCarouselSkeleton count={6} size="sm" />
    </section>
  );
}
