import { OriginationLoadingState } from "./origination-loading-state";

/** Visible label shown during the credit-check loading screen. */
export const CREDIT_CHECK_LOADING_LABEL = "Checking your credit report...";

/**
 * Credit-check loading screen — brand variant (simple spinner), shown while
 * the credit decision is being retrieved. Sits outside the shell chrome;
 * the progress bar is hidden while this screen is active.
 *
 * Uses `step="late"` because credit-check occurs after identity/income,
 * when an offer estimate already exists.
 *
 * @example
 * ```tsx
 * <CreditCheckLoading />
 * ```
 */
export function CreditCheckLoading() {
  return <OriginationLoadingState label={CREDIT_CHECK_LOADING_LABEL} step="late" />;
}
