import { PanelCard } from "@shared/components/card";
import { Separator } from "@ucmp/ui";
import type { ReactNode } from "react";
import type { PurchaseCardUpperProps } from "./purchase-card.types";
import { PurchaseCardUpper } from "./purchase-card-upper";

export interface PurchaseCardProps extends PurchaseCardUpperProps {
  /**
   * Slot for the booking strip — rendered below the separator when provided.
   * Data sourced from `dealer.extended.testDrive` in the BFF response.
   */
  bookingStrip?: ReactNode;
}

/**
 * Purchase Card — full shell.
 *
 * Responsive behaviour:
 * - Desktop (lg+): Renders inside a PanelCard with `surface="dark"` — glassmorphic
 *   dark card with rounded corners, padded content, and sticky positioning.
 * - Mobile/Tablet (<lg): Renders as transparent content with `data-surface="dark"`
 *   so all text/icon tokens use dark-mode variants, matching the dark hero background.
 *
 * Composes:
 * - PanelCard (shared) — glassmorphic card primitive with surface-aware bg (desktop only)
 * - PurchaseCardUpper — header + payment + CTA + availability
 * - bookingStrip slot — test drive scheduling strip below the separator
 */
export function PurchaseCard({ bookingStrip, ...upperProps }: PurchaseCardProps) {
  return (
    <>
      {/* ─── Mobile/Tablet: transparent lockup on dark hero bg ──── */}
      <div
        className="flex w-full flex-col px-0 pt-0 lg:hidden lg:pb-8"
        data-surface="dark"
        data-testid="purchase-card"
      >
        <PurchaseCardUpper {...upperProps} />

        {bookingStrip && bookingStrip}
      </div>

      {/* ─── Desktop: glassmorphic PanelCard in sticky rail ──────── */}
      <PanelCard
        className="hidden w-full max-w-md px-8 pt-12 pb-14 lg:block xl:max-w-none"
        data-testid="purchase-card"
      >
        <PurchaseCardUpper {...upperProps} enableStickyCta={false} />

        {bookingStrip && (
          <>
            <Separator />
            {bookingStrip}
          </>
        )}
      </PanelCard>
    </>
  );
}
