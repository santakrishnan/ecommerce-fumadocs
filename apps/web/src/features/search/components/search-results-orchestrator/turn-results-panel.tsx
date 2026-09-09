import { CARD_HOVER_SCALE, CardCarousel } from "@shared/components/card";
import type { Vehicle } from "@shared/components/inventory-card";
import { InventoryResultsGrid } from "@shared/components/inventory-card";
import { Button } from "@ucmp/ui";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SubmitTurnOptions } from "../../hooks/use-agent-search-turns";
import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import { inferGridVariant } from "../../lib/infer-grid-variant";
import { createResultCardRenderer } from "../../lib/render-result-card";
import type { SearchResultItem } from "../../types/search-results";
import { getResultItemKey } from "./constants";

export interface TurnResultsPanelProps {
  options?: { renderItem?: (item: SearchResultItem) => ReactNode };
  results: SearchResultItem[];
  submitTurn: (options: SubmitTurnOptions) => void;
  turn: AgentSearchTurn;
}

/**
 * Determines whether the results set is exclusively inventory cards.
 * Used for grid vs carousel selection — mixed base-mapped responses (spec +
 * inventory) always use carousel since the grid only renders Vehicle data.
 */
function isInventoryOnlyResponse(results: SearchResultItem[]): string {
  // Check the mapped results — works for both legacy V2 and base-mapped paths
  // since both produce SearchResultItem[] with type discriminators by this point.
  if (results.length > 0 && results.every((item) => item.type === "inventory")) {
    return "inventory";
  }

  return "";
}

export function buildResultsPanel(
  turn: AgentSearchTurn,
  results: SearchResultItem[],
  submitTurn: (options: SubmitTurnOptions) => void,
  options?: { renderItem?: (item: SearchResultItem) => ReactNode }
): ReactNode {
  return (
    <TurnResultsPanel options={options} results={results} submitTurn={submitTurn} turn={turn} />
  );
}

export function TurnResultsPanel({ turn, results, submitTurn, options }: TurnResultsPanelProps) {
  const isInventoryCard = isInventoryOnlyResponse(results);

  const gridVariant = inferGridVariant(isInventoryCard, results.length, turn.inventoryGridVariant);

  if (gridVariant) {
    return (
      <InventoryResultsGrid
        size="search-fill"
        variant={gridVariant}
        vehicles={results.map((result) => result.data as Vehicle)}
      />
    );
  }

  const renderItem = options?.renderItem ?? createResultCardRenderer(submitTurn);

  return (
    <CardCarousel
      aria-label="Search results carousel"
      getItemKey={getResultItemKey}
      hoverScaleRatio={CARD_HOVER_SCALE.search}
      items={results}
      renderItem={renderItem}
    />
  );
}

export function buildSeeAllButton(seeAllHref: string | undefined) {
  if (!seeAllHref) {
    return null;
  }
  return (
    <Button
      nativeButton={false}
      render={
        <Link href={seeAllHref} prefetch={true}>
          See all results
        </Link>
      }
      size="lg"
      surface="dark"
      variant="tertiary"
    />
  );
}
