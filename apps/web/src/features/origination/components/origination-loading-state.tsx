import { LoadingState } from "@shared/components/loading-state";
import { cn } from "utils";

/** Background image for the origination variant. */
const ORIGINATION_BG_IMAGE = "/images/origination/loading_background.png";

/** Early-flow label (origination variant). */
export const ORIGINATION_LOADING_LABEL_EARLY =
  "No hidden fees. Plus 7-day returns and a 90-day warranty.";

/** Late-flow label (brand variant). */
export const ORIGINATION_LOADING_LABEL_LATE = "Getting your offer ready...";

/**
 * Where in the origination flow the loading screen appears.
 *
 * - `"early"` — before an estimate exists (e.g. prequal fetch). Origination
 *   variant: car background clipped to the Toyota X icon, larger icon, wrapping label.
 * - `"late"` — after an estimate, progressing through the offer flow. Brand
 *   variant: spinning brand-coloured icon, ellipsis label.
 */
export type OriginationLoadingStep = "early" | "late";

export interface OriginationLoadingStateProps {
  /** Extra classes forwarded to LoadingState's root. */
  className?: string;
  /** Override the label. Defaults per `step`. */
  label?: string;
  /**
   * Flow step — determines the variant and default label.
   * @default "early"
   */
  step?: OriginationLoadingStep;
}

/**
 * Origination loading screen — wraps {@link LoadingState}, picking the variant
 * from `step`. Full-bleed and self-sizing (`min-h-dvh`): it owns its own
 * viewport-height surface rather than rendering through the grid-aware
 * OriginationLayout, so the child controls the background with no parent
 * surface layer showing behind it.
 *
 * @example
 * ```tsx
 * <OriginationLoadingState />                                    // early (default)
 * <OriginationLoadingState step="late" />                        // late
 * <OriginationLoadingState label="Checking your eligibility..." /> // custom label
 * ```
 */
export function OriginationLoadingState({
  step = "early",
  label,
  className,
}: OriginationLoadingStateProps) {
  const isEarly = step === "early";

  const resolvedLabel =
    label ?? (isEarly ? ORIGINATION_LOADING_LABEL_EARLY : ORIGINATION_LOADING_LABEL_LATE);

  return (
    <LoadingState
      backgroundImage={isEarly ? ORIGINATION_BG_IMAGE : undefined}
      className={cn("min-h-dvh", className)}
      label={resolvedLabel}
      variant={isEarly ? "origination" : "brand"}
    />
  );
}
