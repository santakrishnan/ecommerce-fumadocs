"use client";

import { PageGrid } from "@ucmp/ui";
import type { ReactNode } from "react";
import { cn } from "utils";
import type { SubmitTurnOptions } from "../../hooks/use-agent-search-turns";
import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import { getCanonicalCardTurn } from "../../lib/response-cards";
import type { SearchResultItem } from "../../types/search-results";
import { CAROUSEL_BLEED_RIGHT } from "./constants";
import { TurnCards } from "./turn-cards";
import { TurnConversation } from "./turn-conversation";
import { turnToResultItems } from "./turn-mappers";

export interface CompletedTurnRowProps {
  domRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Settled follow-up turns attached to this row. Their request/response text is
   * appended below this turn's conversation. The row's cards stay its canonical
   * cards.
   */
  followUps?: AgentSearchTurn[];
  intentEyebrowOverride?: string | { text: string; icon?: ReactNode };
  /** When true, cards render without interactivity. */
  readOnly?: boolean;
  /** Optional override renderer for result cards (e.g. the read-only renderer). */
  renderItem?: (item: SearchResultItem) => ReactNode;
  submitTurn: (options: SubmitTurnOptions) => void;
  /** When true, hides content while the row scrolls off-screen (prevents flash on turn transition). */
  suppressContent?: boolean;
  turn: AgentSearchTurn;
}

/**
 * A settled turn rendered at full height with cards shown immediately.
 *
 * pt-[--search-nav-height] on each turn is intentional: each turn acts as a
 * full "page" in the scroll thread with clear space behind the floating nav,
 * so content never peeks through behind the header between turns.
 * Text-only turns span 8 columns; card turns use a 4 + 7 split with a
 * 1-column spacer.
 */
export function CompletedTurnRow({
  turn,
  domRef,
  intentEyebrowOverride,
  readOnly,
  renderItem,
  submitTurn,
  suppressContent,
  followUps,
}: CompletedTurnRowProps) {
  // Cards come from the row's canonical-card turn (the first turn in the chain
  // to carry non-pill cards), which may be a follow-up rather than this anchor.
  const cardTurn = getCanonicalCardTurn([turn, ...(followUps ?? [])]);
  const results = cardTurn ? turnToResultItems(cardTurn) : [];
  const isTextOnly = results.length === 0;
  const showCards = results.length > 0;

  return (
    <PageGrid className="pt-(--search-nav-height,7.5rem) lg:h-dvh lg:snap-start" ref={domRef}>
      <div
        className={cn(
          "scrollbar-none col-span-4 md:col-span-8 lg:h-full lg:min-h-0 lg:overflow-y-auto",
          isTextOnly ? "lg:col-span-8" : "lg:col-span-4",
          suppressContent && "invisible"
        )}
      >
        <div className="pb-10 lg:pt-6">
          <TurnConversation
            followUps={followUps}
            intentEyebrowOverride={intentEyebrowOverride}
            readOnly={readOnly}
            submitTurn={submitTurn}
            turn={turn}
          />
        </div>
      </div>
      {showCards && (
        <div
          className={cn(
            "col-span-full pb-10 lg:flex lg:flex-col lg:pt-6",
            results.length === 6 ? "lg:col-span-7 lg:col-start-6" : "lg:col-span-8 lg:col-start-6",
            suppressContent && "invisible"
          )}
        >
          {/* seeAllHref is intentionally omitted: completed rows already display
              their full card set inline. The "See All Results" CTA only renders
              on the active turn (see active-turn-row.tsx) where inventory cards
              preview a subset. If you need the link here, compute it via
              getSeeAllHref(cardTurn, results) and pass as a prop. */}
          <TurnCards
            panelClassName={CAROUSEL_BLEED_RIGHT}
            renderItem={renderItem}
            results={results}
            seeAllWrapperClassName="mt-8 flex w-full items-center justify-start lg:mt-4 lg:justify-end"
            submitTurn={submitTurn}
            turn={cardTurn ?? turn}
          />
        </div>
      )}
    </PageGrid>
  );
}
