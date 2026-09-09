/** Static copy shown on the trade-in offer full-screen page, per Figma. */
export const TRADE_IN_OFFER_TEXT = "Trade-in offer flow";

/**
 * Trade-in offer page — full-screen, static stub.
 *
 * Owns `min-h-dvh` so it fills the viewport at the route level without
 * requiring a wrapper. In the demo tab preview the tab wrapper overrides
 * `min-height` via a scoped child selector (`*:[section]:min-h-full`)
 * to constrain it to the preview box — the same technique used by
 * `CreditCheckLoadingTab`. No actions, no shared components, no dynamic data.
 *
 * @example
 * ```tsx
 * <TradeInOfferContent />
 * ```
 */
export function TradeInOfferContent() {
  return (
    <section className="flex min-h-dvh items-center justify-center bg-surface-secondary">
      <h1 className="h1 text-text-primary">{TRADE_IN_OFFER_TEXT}</h1>
    </section>
  );
}
