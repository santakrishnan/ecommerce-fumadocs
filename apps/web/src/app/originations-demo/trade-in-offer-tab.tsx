import { TradeInOfferContent } from "@features/origination";

/**
 * Demo tab for the trade-in offer full-screen page (PEDX01-3371).
 *
 * TradeInOfferContent owns `min-h-dvh` for production. The
 * `*:[section]:min-h-full` selector overrides that to fill the
 * `h-96` preview box instead of the viewport — same technique as
 * CreditCheckLoadingTab.
 */
export function TradeInOfferTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">
        ⬇ Full-screen in production (min-h-dvh, no shell chrome). Constrained here for preview.
      </p>
      <div className="relative h-96 overflow-hidden rounded-lg border-2 border-surface-muted border-dashed *:[section]:min-h-full">
        <TradeInOfferContent />
      </div>
    </div>
  );
}
