"use client";

import dynamic from "next/dynamic";

export type { SearchResultsOrchestratorProps } from "./search-results-orchestrator";

/**
 * Loads SearchResultsOrchestrator with SSR disabled.
 *
 * The orchestrator calls useAgentSearchTurns → useLiveQuery → useSyncExternalStore
 * without a server snapshot. Next.js would otherwise attempt an SSR pass that
 * produces nothing and emits a React warning. ssr: false skips that pass entirely.
 *
 * Per Next.js docs, ssr: false is only supported inside Client Components.
 * This file is intentionally "use client" for that reason.
 * See: https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr
 */
export const SearchResultsOrchestratorWrapper = dynamic(
  () => import("./search-results-orchestrator").then((m) => m.SearchResultsOrchestrator),
  { ssr: false }
);
