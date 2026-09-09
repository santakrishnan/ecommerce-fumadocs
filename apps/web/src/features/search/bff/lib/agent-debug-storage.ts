import "server-only";

import path from "node:path";
import { env } from "@config/env";

/**
 * Shared storage contract for the dev-only agent stream debug tooling.
 *
 * The recorder (write side) and reader (read side) both import from here so
 * the on-disk layout and safety rules never drift between them.
 *
 * On-disk layout (gitignored — see apps/web/.gitignore):
 *   apps/web/.debug/search/<searchId>/<traceId>.json
 *
 * Each file is a single {@link AgentDebugTrace} — the complete, untransformed
 * frame sequence for one upstream agent stream, captured BEFORE Zod validation
 * strips unknown keys.
 */

/**
 * True in development, independent of the capture flag. Gates the reachable
 * surface — the `/debug` routes and the clear action — so previously captured
 * traces can still be viewed and cleared after capture is switched off. Never
 * true in production.
 */
export const AGENT_DEBUG_DEV = process.env.NODE_ENV === "development";

/**
 * Master switch for trace CAPTURE (writing `.debug` files). Off by default even
 * in development, so no one gets surprise debug files they didn't opt into.
 * Enable with `SEARCH_AGENT_DEBUG=true` (see apps/web/.env.local.example).
 */
export const AGENT_DEBUG_ENABLED = AGENT_DEBUG_DEV && env.SEARCH_AGENT_DEBUG === "true";

/** Base directory for captured traces. Resolved against the dev-server cwd (apps/web). */
export const DEBUG_SEARCH_DIR = path.join(process.cwd(), ".debug", "search");

/** Placeholder searchId used when no frame in the stream carries one. */
export const UNKNOWN_SEARCH_ID = "unknown";

export type AgentStreamOutcome = "completed" | "failed" | "client-disconnected";

/** Wall-clock timeline for one stream. Durations are ms from request start; null = never reached. */
export interface AgentStreamTimings {
  /** Count of events received from the upstream. */
  eventsReceived: number;
  /** Count of events forwarded to the browser. */
  eventsSent: number;
  /** Time until the first event arrived from the upstream. */
  firstEventMs: number | null;
  /** Type of the last event received from the upstream (useful when it ends early). */
  lastEventReceived: string | null;
  outcome: AgentStreamOutcome;
  /** Time until the finished result arrived from the upstream. */
  resultReceivedMs: number | null;
  /** Time until the finished result was forwarded to the browser. */
  resultSentMs: number | null;
  /** Total time from request start to stream close. */
  totalMs: number;
  /** Time until the upstream sent its first response (headers). */
  upstreamResponseMs: number | null;
}

/**
 * A single captured stream — every raw SSE frame in the order it arrived,
 * plus lightweight metadata for listing.
 */
export interface AgentDebugTrace {
  /** ISO timestamp of when capture started. */
  capturedAt: string;
  /** Number of frames captured. */
  frameCount: number;
  /** Raw, untransformed SSE frames exactly as parsed off the wire. */
  frames: unknown[];
  /**
   * The upstream request body sent for this stream, stored verbatim. For the
   * base/agent backends this is the `{ request, debug }` envelope; for v2/sdk it's the
   * flat request. Contains no auth material (cookies/tokens live in headers).
   */
  request?: unknown;
  /** Conversation session id, extracted from the frames (or "unknown"). */
  searchId: string;
  /** Backend label that produced the stream (e.g. "V1 agent", "V2 agent"). */
  serviceLabel: string;
  /** Wall-clock timeline for the stream (absent on traces captured before this existed). */
  timings?: AgentStreamTimings;
  /** Per-stream unique id. */
  traceId: string;
}

/** Listing-level summary — everything the index page needs without loading frames. */
export interface AgentDebugTraceSummary {
  capturedAt: string;
  frameCount: number;
  /** How the stream ended, from its timings (if present). */
  outcome?: AgentStreamOutcome;
  /** User query text from the request, if any (absent for card-click turns). */
  query?: string;
  /** responseMode of the Complete frame, if present (InventoryCards, ComparisonCards, …). */
  responseMode?: string;
  searchId: string;
  serviceLabel: string;
  /** summary text of the Complete frame, if present. */
  summary?: string;
  /** Total stream duration in ms, from its timings (if present). */
  totalMs?: number;
  traceId: string;
}

/** Characters outside this safe set are stripped from a path segment. */
const UNSAFE_SEGMENT_CHARS = /[^A-Za-z0-9._-]/g;
/** Leading dots collapse to avoid `.`/`..` traversal segments. */
const LEADING_DOTS = /^\.+/;

/**
 * Sanitize a value for safe use as a single path segment. Prevents path
 * traversal (`..`, `/`, `\`) and keeps filesystem-hostile characters out.
 * Anything outside `[A-Za-z0-9._-]` becomes `_`. Empty results fall back to
 * {@link UNKNOWN_SEARCH_ID}.
 */
export function sanitizeSegment(value: string): string {
  const cleaned = value.replace(UNSAFE_SEGMENT_CHARS, "_").replace(LEADING_DOTS, "_");
  return cleaned.length > 0 ? cleaned : UNKNOWN_SEARCH_ID;
}
