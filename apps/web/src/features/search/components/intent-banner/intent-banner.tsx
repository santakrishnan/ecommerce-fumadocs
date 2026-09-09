import { Button } from "@ucmp/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "utils";
import type { SearchLoadingBeat } from "../search-loading-indicator";
import { SearchLoadingIndicator } from "../search-loading-indicator";
import { IntentEyebrow } from "./intent-eyebrow";

/** Single CTA action rendered below the LLM response */
export interface IntentBannerAction {
  /** Optional href for link-style CTAs */
  href?: string;
  /** Button label */
  label: string;
  /** Click handler – wired by the parent orchestrator */
  onClick?: () => void;
}

export interface IntentBannerProps {
  /** Optional list of CTA actions rendered below the response. */
  actions?: IntentBannerAction[];
  /** Shopper-facing progress checklist streamed during the loading transition */
  beats?: SearchLoadingBeat[];
  /** Additional class names for the outer wrapper */
  className?: string;
  /**
   * Optional user-intent eyebrow displayed above the response.
   * - Pass a `string` for a plain query eyebrow.
   * - Pass `{ text, icon }` to include a leading icon (e.g. preferences notification).
   */
  intentEyebrow?: string | { text: string; icon?: ReactNode };
  /** Whether the LLM is currently generating (shows progress state) */
  isLoading?: boolean;
  /** Final LLM response text displayed when generation is complete */
  response?: ReactNode;
  /** Status/progress text shown while the LLM is generating */
  statusText?: string;
}

/**
 * IntentBanner component for the conversational search journey.
 *
 * Renders four visual states based on provided data:
 * 1. User Intent eyebrow (optional)
 * 2. In-progress / status indicator
 * 3. Final response text
 * 4. CTA actions (optional)
 *
 * This component is presentation-only – it does not fetch data or manage
 * streaming orchestration.
 */
export function IntentBanner({
  intentEyebrow,
  isLoading = false,
  statusText,
  response,
  actions,
  className,
  beats,
}: IntentBannerProps) {
  const hasResponse = Boolean(response);

  return (
    <section
      aria-label="Intent banner"
      className={cn("flex w-full max-w-full animate-slide-up-delayed flex-col gap-8", className)}
    >
      {/* User Intent Eyebrow — single-line by default, with overflow toggle */}
      {intentEyebrow && (
        <IntentEyebrow
          leadingIcon={typeof intentEyebrow === "string" ? undefined : intentEyebrow.icon}
          text={typeof intentEyebrow === "string" ? intentEyebrow : intentEyebrow.text}
        />
      )}

      {/* In-progress state — SearchLoadingIndicator with status text */}
      {isLoading && (
        <div data-testid="intent-banner-loading">
          <SearchLoadingIndicator beats={beats} thinkingStatus={statusText || "Thinking..."} />
        </div>
      )}

      {/* Final response state */}
      {!isLoading && hasResponse && (
        <div
          className={cn("animate-intent-banner-slide-up")}
          data-surface="dark"
          data-testid="intent-banner-response"
        >
          {typeof response === "string" ? (
            <p className="body-xl whitespace-pre-line text-text-primary">{response}</p>
          ) : (
            response
          )}

          {/* CTA Actions — renders inside the response block when provided */}
          {actions && actions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3" data-testid="intent-banner-cta">
              {actions.map((cta) =>
                cta.href ? (
                  <Button
                    key={cta.label}
                    nativeButton={false}
                    render={<Link href={cta.href}>{cta.label}</Link>}
                    size="lg"
                    variant="tertiary"
                  >
                    {cta.label}
                  </Button>
                ) : (
                  <Button key={cta.label} onClick={cta.onClick} size="lg" variant="tertiary">
                    {cta.label}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
