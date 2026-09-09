import { readLocationFromCookies } from "@features/location/server";
import { SearchResultsPage } from "@features/search";
import type { SelectedContextFilter } from "@features/search/bff/contracts/filters-response.schema";
import { SearchResultsSkeleton } from "@features/search/components/search-results-skeleton";
import {
  contextFiltersToActiveFilters,
  contextFiltersToSmartFilters,
} from "@features/search/lib/filter-converters";
import { getPaginatedResults } from "@features/search/services/get-paginated-results";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
export const instant = false;
export const metadata: Metadata = {
  description: "Find the right vehicle for you.",
  title: "Search",
};

type PageParams = Promise<{ id: string }>;

// ─── async leaf: awaits dynamic data ────────────────────────────────────────
async function SearchResultsContent({ params }: { params: PageParams }) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  // Read filters from the httpOnly cookie written by storeSearchFilters
  // (called on the search page when a turn completes). Falls back to [] so
  // direct URL navigation still works — Arrow resolves context via searchId.
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(`search-filters-${id}`)?.value;
  let rawFilters: SelectedContextFilter[] = [];
  if (cookieValue) {
    try {
      const parsed: unknown = JSON.parse(cookieValue);
      if (Array.isArray(parsed)) {
        rawFilters = parsed as SelectedContextFilter[];
      }
    } catch {
      // malformed cookie — proceed with empty filters
    }
  }

  const agentFilters = contextFiltersToSmartFilters(rawFilters);
  const initialActiveFilters = contextFiltersToActiveFilters(rawFilters);
  const identity = await readVisitorIdentity();
  // Read cookies here (disallowed inside getPaginatedResults' "use cache" scope).
  const location = await readLocationFromCookies();
  const paginatedData = await getPaginatedResults(id, agentFilters, identity, location);

  return (
    <SearchResultsPage
      cookieHasFilters={rawFilters.length > 0}
      initialActiveFilters={initialActiveFilters}
      paginatedData={paginatedData}
    />
  );
}

// ─── page: synchronous — static shell streams immediately from CDN ────────────
export default function SearchResultsAll({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResultsContent params={params} />
    </Suspense>
  );
}
