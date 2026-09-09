"use client";

import { Button, type ButtonProps, Progress } from "@ucmp/ui";
import { IconClose } from "@ucmp/ui/icons";
import type { ReactNode } from "react";
import { OriginationLayout } from "./origination-layout";

/** A footer button (primary or tertiary) on the origination panel. */
interface PanelAction {
  /** Forwarded to the Button (`onClick`, `type="submit"`, `form`, …); spread first, so panel props win. */
  buttonProps?: Omit<ButtonProps, "children">;
  /** Disabled state — typically driven by realtime form validity. */
  disabled?: boolean;
  label: string;
}

interface OriginationPanelProps {
  children: ReactNode;
  description?: string;
  /** Wires the close button. Expected whenever the top bar is shown. */
  onClose?: () => void;
  primaryAction?: PanelAction;
  /** Progress bar value, 0–100. Default 0. */
  progress?: number;
  /** Show the progress bar. Default true. */
  showProgress?: boolean;
  /** Show the top row (close + optional progress). Default true. */
  showTopBar?: boolean;
  tertiaryAction?: PanelAction;
  title: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A presentational step screen in the origination flow: top row (progress +
 * close), header, scrollable content, and sticky footer, stacked inside the
 * centered column owned by {@link OriginationLayout}. Carries no flow logic —
 * the caller supplies title, copy, progress, and actions. Loading and error are
 * separate screens, not states of this panel.
 */
function OriginationPanel({
  title,
  description,
  showTopBar = true,
  onClose,
  children,
  primaryAction,
  progress = 0,
  showProgress = true,
  tertiaryAction,
}: OriginationPanelProps) {
  const hasFooter = Boolean(primaryAction || tertiaryAction);

  return (
    <OriginationLayout
      contentClassName="h-full overflow-x-hidden overflow-y-auto"
      contentSlot="origination-panel-content"
    >
      {/* Close button — absolutely positioned against the screen wrapper so it
          always sits at the viewport's top-right corner, regardless of the
          content column width. Mirrors the pattern used in DialogContent. */}
      {showTopBar && onClose && (
        <Button
          aria-label="Close"
          className="absolute top-4 right-4 lg:top-6 lg:right-6"
          onClick={onClose}
          size="icon"
          variant="secondary"
        >
          <IconClose />
        </Button>
      )}

      {/* Top row — kept for progress bar; min-height preserves layout even when
          no controls are rendered (prevents content shift when progress hidden). */}
      <div
        className="mb-4 flex min-h-14 items-center gap-4 py-5 lg:mb-8 lg:py-8"
        data-slot="origination-panel-top"
      >
        {showTopBar && showProgress && <Progress className="w-25 flex-none" value={progress} />}
      </div>

      {/* Header */}
      <header
        className="mb-8 flex flex-col gap-3 lg:mb-10 lg:gap-4"
        data-slot="origination-panel-header"
      >
        <h2 className="h1 lg:h2 text-text-primary" data-slot="origination-panel-title">
          {title}
        </h2>
        {description && (
          <p
            className="body-md md:body-lg text-text-secondary"
            data-slot="origination-panel-description"
          >
            {description}
          </p>
        )}
      </header>

      {/* Content */}
      {children}

      {/* Footer — sticks to the scroll container's bottom edge */}
      {hasFooter && (
        <footer
          className="sticky bottom-0 mt-auto flex flex-col gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:flex-row lg:justify-between lg:pb-6"
          data-slot="origination-panel-footer"
        >
          {tertiaryAction && (
            <Button
              {...tertiaryAction.buttonProps}
              className="lg:w-auto"
              disabled={tertiaryAction.disabled}
              fullWidth
              size="lg"
              variant="tertiary"
            >
              {tertiaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              {...primaryAction.buttonProps}
              className="lg:ml-auto lg:w-auto"
              disabled={primaryAction.disabled}
              fullWidth
              size="lg"
            >
              {primaryAction.label}
            </Button>
          )}
        </footer>
      )}
    </OriginationLayout>
  );
}

export type { OriginationPanelProps, PanelAction };
export { OriginationPanel };
