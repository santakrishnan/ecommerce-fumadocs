"use client";

import type { ReactNode } from "react";
import type { SubmitTurnOptions } from "../../hooks/use-agent-search-turns";
import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import type { SearchResultItem } from "../../types/search-results";
import { buildResultsPanel, buildSeeAllButton } from "./turn-results-panel";

export interface TurnCardsProps {
  /** Classes for the carousel/grid wrapper (carousel bleed vs mobile inset). */
  panelClassName?: string;
  /** Optional override renderer for result cards (e.g. the read-only renderer). */
  renderItem?: (item: SearchResultItem) => ReactNode;
  results: SearchResultItem[];
  seeAllHref?: string;
  /** Classes for the "See all" wrapper — alignment differs per placement. */
  seeAllWrapperClassName?: string;
  submitTurn: (options: SubmitTurnOptions) => void;
  turn: AgentSearchTurn;
}

/**
 * The card side of a turn: the results carousel/grid plus the optional
 * "See all results" button. Layout and motion wrappers stay with the caller;
 * this renders the inner content so the same card block can be placed inline on
 * mobile and in the sticky desktop column.
 */
export function TurnCards({
  turn,
  results,
  submitTurn,
  seeAllHref,
  panelClassName,
  seeAllWrapperClassName,
  renderItem,
}: TurnCardsProps) {
  const options = renderItem ? { renderItem } : undefined;
  return (
    <>
      <div className={panelClassName}>{buildResultsPanel(turn, results, submitTurn, options)}</div>
      {seeAllHref && <div className={seeAllWrapperClassName}>{buildSeeAllButton(seeAllHref)}</div>}
    </>
  );
}
