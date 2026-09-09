"use client";

import { useAgentSearchTurnsCollection } from "@features/search/hooks/use-agent-search-turns-collection";
import type { AgentSearchTurnsCollection } from "@features/search/lib/agent-search-turns-collection";
import { CARD_HOVER_SCALE, CardCarousel, type CardCarouselProps } from "@shared/components/card";
import { EDITORIAL_SIZE_TOKEN, LinkEditorialCard } from "@shared/components/editorial-card";
import { eq, or, useLiveQuery } from "@tanstack/react-db";
import type { IconProps } from "@ucmp/ui/icons";
import { IconBinocular, IconBolt, IconLocation } from "@ucmp/ui/icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { EditorialCardData, EditorialIconName } from "../data/personalized-search-cards";

/** Resolves serializable icon names to actual components (client-side only). */
const ICON_MAP: Record<EditorialIconName, React.ComponentType<IconProps>> = {
  bolt: IconBolt,
  binocular: IconBinocular,
  location: IconLocation,
};

interface PersonalizedSearchCarouselProps {
  /** Array of personalized search card data to render in the carousel. */
  cards: EditorialCardData[];
  /** Number of PageGrid columns each carousel item should span. */
  colSpan?: CardCarouselProps<EditorialCardData>["colSpan"];
  /** Card size variant passed to each EditorialCard. Defaults to "large". */
  size?: "medium" | "large";
}

/**
 * Inserts a "queued" turn into IDB so the orchestrator auto-submits it on mount.
 */
function seedQueuedTurn(
  collection: AgentSearchTurnsCollection,
  searchId: string,
  query?: string
): void {
  collection.insert({
    id: crypto.randomUUID(),
    searchId,
    role: "user",
    ...(query ? { query } : {}),
    status: "queued",
    submittedAt: Date.now(),
    autoSubmitted: true,
  });
}

const FALLBACK_HEADLINE = "Saved search";

/**
 * Client-side personalized search carousel using the shared `CardCarousel`
 * wrapper with hover-scale support. Uses `CARD_HOVER_SCALE` mapped via
 * `EDITORIAL_SIZE_TOKEN` so large editorial cards scale at 1.015× on hover.
 *
 * Resolves serializable `iconName` strings to icon components here
 * because React components can't cross the server→client boundary.
 *
 * For cards with `nextSearchPlan` data, an onClick handler seeds a "queued"
 * turn into the IDB collection before navigation. The orchestrator at
 * /search/[id] picks it up and submits it as a real API call.
 *
 * Enriches headlines from IDB when the API didn't return a name/query:
 *   1. API response (session.name or session.query) — set server-side
 *   2. IDB agent-search-turns query for the matching searchId
 *   3. Fallback: "Saved search"
 *
 * Displays large editorial cards with partial overflow to indicate scrollability.
 * Visible cards per breakpoint:
 *   Desktop: ~3 full cards
 *   Tablet: ~2.15 cards (partial overflow)
 *   Mobile: ~1.15 cards (partial overflow)
 */
export function PersonalizedSearchCarousel({
  cards,
  colSpan,
  size = "large",
}: PersonalizedSearchCarouselProps) {
  const collection = useAgentSearchTurnsCollection();

  // Gate IDB queries to client-only (avoids "Missing getServerSnapshot" during SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Collect searchIds from cards that need IDB enrichment
  const searchIdsNeedingEnrichment = useMemo(
    () =>
      cards
        .filter((c) => c.headline === FALLBACK_HEADLINE && c.nextSearchPlan?.searchId)
        .map((c) => c.nextSearchPlan?.searchId)
        .filter(Boolean) as string[],
    [cards]
  );

  // Query IDB for turns matching those searchIds to extract their query text
  const { data: idbTurns = [] } = useLiveQuery(
    (q) => {
      if (!(mounted && collection) || searchIdsNeedingEnrichment.length === 0) {
        return;
      }
      return q
        .from({ t: collection })
        .where(({ t }) => {
          const first = eq(t.searchId, searchIdsNeedingEnrichment[0]);
          if (searchIdsNeedingEnrichment.length === 1) {
            return first;
          }
          return searchIdsNeedingEnrichment
            .slice(1)
            .reduce((acc, id) => or(acc, eq(t.searchId, id)), first);
        })
        .orderBy(({ t }) => t.submittedAt, "asc")
        .select(({ t }) => ({ searchId: t.searchId, query: t.query }));
    },
    [mounted, collection, searchIdsNeedingEnrichment]
  );

  // Build a lookup: searchId → first non-empty query from IDB
  const idbQueryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const turn of idbTurns) {
      if (turn.query?.trim() && !map.has(turn.searchId)) {
        map.set(turn.searchId, turn.query.trim());
      }
    }
    return map;
  }, [idbTurns]);

  // Enrich cards: replace "Saved search" with IDB query if available
  const enrichedCards = useMemo(
    () =>
      cards.map((card) => {
        if (card.headline !== FALLBACK_HEADLINE || !card.nextSearchPlan?.searchId) {
          return card;
        }
        const idbQuery = idbQueryMap.get(card.nextSearchPlan.searchId);
        if (!idbQuery) {
          return card;
        }
        return { ...card, headline: idbQuery };
      }),
    [cards, idbQueryMap]
  );

  const handleCardClick = useCallback(
    (searchId: string, query?: string) => {
      seedQueuedTurn(collection, searchId, query);
    },
    [collection]
  );

  return (
    <CardCarousel
      colSpan={colSpan}
      getItemKey={(card) => card.href}
      hoverScaleRatio={CARD_HOVER_SCALE[EDITORIAL_SIZE_TOKEN[size]]}
      items={enrichedCards}
      renderItem={({ iconName, nextSearchPlan, ...card }) => (
        <LinkEditorialCard
          {...card}
          icon={iconName ? ICON_MAP[iconName] : undefined}
          linkProps={
            nextSearchPlan
              ? {
                  onNavigate: () => handleCardClick(nextSearchPlan.searchId, nextSearchPlan.query),
                }
              : undefined
          }
          size={size}
        />
      )}
    />
  );
}
