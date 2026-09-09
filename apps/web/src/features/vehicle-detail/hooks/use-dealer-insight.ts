"use client";

import type { DealerInsightResponse } from "@features/vehicle-detail/bff";
import { useQuery } from "@tanstack/react-query";

// ─── Query Key ────────────────────────────────────────────────────────────────

export const DEALER_INSIGHT_QUERY_KEY = "dealer-insight" as const;

function dealerInsightQueryKey(dealerCode: string) {
  return [DEALER_INSIGHT_QUERY_KEY, dealerCode] as const;
}

// ─── Query Fn ─────────────────────────────────────────────────────────────────

async function fetchDealerInsight(dealerCode: string): Promise<DealerInsightResponse> {
  const response = await fetch(`/api/v1/dealer-insight/${encodeURIComponent(dealerCode)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Dealer insight fetch failed: ${response.status}`);
  }

  return response.json() as Promise<DealerInsightResponse>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseDealerInsightOptions {
  /** Dealer code to fetch insight data for. */
  dealerCode: string;
  /** When false, the query will not execute (lazy loading on dialog open). */
  enabled?: boolean;
  /** Server-prefetched data — seeds the cache so the dialog opens instantly. */
  initialData?: DealerInsightResponse;
}

/**
 * Fetches dealer insight data for the Dealer Insight Modal.
 *
 * When `initialData` is provided (prefetched server-side), the cache is
 * pre-seeded and the dialog renders immediately without a loading state.
 * Falls back to client-side fetch if initial data is not available.
 */
export function useDealerInsight({
  dealerCode,
  enabled = false,
  initialData,
}: UseDealerInsightOptions) {
  return useQuery<DealerInsightResponse>({
    queryKey: dealerInsightQueryKey(dealerCode),
    queryFn: () => fetchDealerInsight(dealerCode),
    enabled,
    initialData,
    staleTime: 5 * 60 * 1000, // 5 min — dealer info rarely changes mid-session
  });
}
