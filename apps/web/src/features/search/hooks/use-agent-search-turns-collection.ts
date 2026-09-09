"use client";

import { useVisitorId } from "@shared/hooks/use-visitor-id";
import type { Collection } from "@tanstack/react-db";
import {
  type AgentSearchTurn,
  getAgentSearchTurnsCollection,
} from "../lib/agent-search-turns-collection";

/**
 * Returns the agent search turns TanStack DB collection scoped to the current
 * visitor. Resolves visitorId once so all consumers share the same instance
 * without needing to call useVisitorId themselves.
 *
 * ```ts
 * const collection = useAgentSearchTurnsCollection();
 * const { data } = useLiveQuery(
 *   (q) => q.from({ t: collection }).where(({ t }) => eq(t.searchId, id)),
 *   [id]
 * );
 * ```
 */
export function useAgentSearchTurnsCollection(): Collection<AgentSearchTurn, string> {
  const visitorId = useVisitorId();
  return getAgentSearchTurnsCollection(visitorId).collection;
}
