"use client";

import { clientEnv } from "@config/client-env";
import { searchByTaxonomy } from "@features/search/actions/search-by-taxonomy";
import type { Vehicle } from "@shared/components/inventory-card";
import { InventoryCardCarousel } from "@shared/components/inventory-card";
import { SectionHeader } from "@shared/components/section-header";
import { useVehicleHistoryCollection } from "@shared/hooks/use-vehicle-history-collection";
import { useLiveQuery } from "@tanstack/react-db";
import { useEffect, useState } from "react";
import { SearchRecommendationsSkeleton } from "./search-recommendations-skeleton";

/** Max vehicles for the taxonomy search. Reads NEXT_PUBLIC_SEARCH_RECS_LIMIT at build time. */
const SEARCH_RECS_LIMIT = clientEnv.NEXT_PUBLIC_SEARCH_RECS_LIMIT ?? 20;

/** Max VINs to send — top 3 most recently viewed vehicles. */
const MAX_TAXONOMY_VINS = 3;

const TITLE = "Because You Viewed";
const SUBTITLE = "I found a few options you haven't seen yet that I think you'll like";

/**
 * Client wrapper for the Search Recommendations section.
 *
 * Data flow:
 * 1. Read VINs from vehicle history (IDB), sorted by viewedAt descending.
 * 2. Take the top 3 most recently viewed VINs.
 * 3. Call `searchByTaxonomy` Server Action.
 *    The server reads location cookies + visitor identity internally.
 * 4. Exclude source VINs from results (handled server-side).
 * 5. If empty or error → render nothing.
 * 6. Render carousel titled "Because You Viewed".
 */
export function SearchRecommendationsClient() {
  // ── Read vehicle history (recently viewed), sorted most recent first ─────
  const historyCollection = useVehicleHistoryCollection();
  const { data: historyItems = [], isLoading } = useLiveQuery(
    (q) => {
      if (!historyCollection) {
        return;
      }
      return q
        .from({ h: historyCollection })
        .orderBy(({ h }) => h.viewedAt, "desc")
        .limit(MAX_TAXONOMY_VINS)
        .select(({ h }) => ({ id: h.id, vin: h.vin }));
    },
    [historyCollection]
  );

  const selectedVins = historyItems
    .map((item) => item.vin ?? item.id)
    .filter((v): v is string => Boolean(v))
    .slice(0, MAX_TAXONOMY_VINS);

  // Stable key for the effect — only re-fetches when the actual VIN list changes.
  const vinKey = selectedVins.join(",");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (vinKey === "") {
      setIsFetching(false);
      setHasFailed(false);
      setVehicles([]);
      return;
    }

    const vins = vinKey.split(",");
    let cancelled = false;
    setIsFetching(true);
    setHasFailed(false);

    searchByTaxonomy(vins, { limit: SEARCH_RECS_LIMIT })
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.success) {
          setHasFailed(true);
          setVehicles([]);
          return;
        }
        setVehicles(result.vehicles);
      })
      .catch(() => {
        if (!cancelled) {
          setHasFailed(true);
          setVehicles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vinKey]);

  if (isLoading || isFetching) {
    return <SearchRecommendationsSkeleton />;
  }

  if (selectedVins.length === 0 || hasFailed || vehicles.length === 0) {
    return null;
  }

  return (
    <section aria-label={TITLE.toLowerCase()} className="w-full">
      <SectionHeader subtitle={SUBTITLE} title={TITLE} />
      <div className="mt-4">
        <InventoryCardCarousel
          activitySource="Recommendations"
          colSpan={{ sm: 2, md: 2, lg: 2 }}
          showSaveIcon
          size="small"
          variant="gradient"
          vehicles={vehicles}
        />
      </div>
    </section>
  );
}
