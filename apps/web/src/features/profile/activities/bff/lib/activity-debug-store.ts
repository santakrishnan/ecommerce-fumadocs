import "server-only";

/**
 * Dev-only in-memory ring buffer for recently recorded activity events.
 *
 * Keyed by visitorId so the debug console at /visitor/debug can display the
 * current visitor's recent activity without a round-trip to the upstream
 * (which has no GET activities endpoint).
 *
 * Never enabled in production — the entire module is a no-op outside
 * NODE_ENV === "development". The buffer is bounded at MAX_ENTRIES_PER_VISITOR
 * to prevent unbounded memory growth in long-running dev sessions.
 *
 * Uses `globalThis` rather than a module-level variable so the store is shared
 * across all module instances in the same Node.js process. Next.js/Turbopack
 * evaluates Server Actions and Route Handlers in separate module contexts, so
 * a plain module-level Map is not visible across those contexts.
 */

const IS_DEV = process.env.NODE_ENV === "development";
const MAX_ENTRIES_PER_VISITOR = 50;
const STORE_KEY = "__ucmp_activity_debug_store__";

export interface ActivityDebugEntry {
  id: string;
  /** Human-readable reason for skipped/error status. */
  reason?: string;
  recordedAt: string;
  status: "error" | "skipped" | "success";
  type: string;
}

function getStore(): Map<string, ActivityDebugEntry[]> {
  const g = globalThis as Record<string, unknown>;
  if (!(g[STORE_KEY] instanceof Map)) {
    g[STORE_KEY] = new Map<string, ActivityDebugEntry[]>();
  }
  return g[STORE_KEY] as Map<string, ActivityDebugEntry[]>;
}

/**
 * Append an entry to the ring buffer for the given visitor.
 * No-op outside development.
 */
export function appendActivityDebugEntry(
  visitorId: string,
  entry: Omit<ActivityDebugEntry, "id" | "recordedAt">
): void {
  if (!IS_DEV) {
    return;
  }
  const full: ActivityDebugEntry = {
    id: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
    ...entry,
  };
  const store = getStore();
  const existing = store.get(visitorId) ?? [];
  store.set(visitorId, [...existing, full].slice(-MAX_ENTRIES_PER_VISITOR));
}

/**
 * Read the ring buffer for a visitor (oldest → newest).
 * Returns an empty array outside development or when no entries exist.
 */
export function getActivityDebugEntries(visitorId: string): ActivityDebugEntry[] {
  if (!IS_DEV) {
    return [];
  }
  return getStore().get(visitorId) ?? [];
}

/**
 * Clear all entries for a visitor.
 * No-op outside development.
 */
export function clearActivityDebugEntries(visitorId: string): void {
  if (!IS_DEV) {
    return;
  }
  getStore().delete(visitorId);
}
