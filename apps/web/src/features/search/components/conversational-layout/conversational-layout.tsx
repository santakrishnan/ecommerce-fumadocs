import type { ReactNode } from "react";

interface ConversationalLayoutProps {
  /** Contextual media panel.
   *  Hidden below md; alongside `thread` at md+.
   *  null/undefined/false collapses to zero width. */
  panel?: ReactNode;
  /** Prompt input bar — pinned to the bottom of the viewport
   *  outside the scroll container at all breakpoints. */
  promptBar: ReactNode;
  /** Primary scrollable content — conversation turn thread.
   *  Full-width below md; alongside `panel` at md+. */
  thread: ReactNode;
}

/**
 * Split-pane layout shell for the conversational search experience.
 *
 * Responsible only for spatial arrangement:
 * - Scrollable thread region (snap-based on lg)
 * - Optional side panel (hidden below md, sticky at md+)
 * - Pinned prompt bar at the bottom, outside the scroll container
 * - No business logic, no context reads.
 */
export function ConversationalLayout({ thread, panel, promptBar }: ConversationalLayoutProps) {
  const hasPanel = panel !== null && panel !== undefined && panel !== false;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {hasPanel ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col">{thread}</div>
          <div className="hidden min-h-0 md:block md:flex-1" data-testid="panel-column">
            {panel}
          </div>
        </div>
      ) : (
        thread
      )}

      {/* Prompt bar — pinned to the bottom, outside scroll container */}
      {promptBar}
    </div>
  );
}
