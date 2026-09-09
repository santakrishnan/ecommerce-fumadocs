import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  type AgentDebugTrace,
  type AgentDebugTraceSummary,
  DEBUG_SEARCH_DIR,
  sanitizeSegment,
} from "./agent-debug-storage";

/**
 * Read side of the dev-only agent debug tooling. Walks the gitignored
 * `.debug/search` tree written by {@link createAgentTraceCapture} and hydrates
 * captured traces for the `/debug/agent` viewer.
 *
 * All filesystem access is defensive: a missing directory (nothing captured
 * yet) yields an empty list rather than throwing, and every path segment is
 * re-sanitized before use so a crafted URL can't escape the base directory.
 */

interface TraceLocation {
  searchId: string;
  traceId: string;
}

/** True for ENOENT — the base dir simply doesn't exist yet (nothing captured). */
function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/** Extract responseMode + summary from the Complete frame for listing. */
function summarizeCompleteFrame(
  frames: unknown[]
): Pick<AgentDebugTraceSummary, "responseMode" | "summary"> {
  for (const frame of frames) {
    if (frame === null || typeof frame !== "object") {
      continue;
    }
    const obj = frame as Record<string, unknown>;
    if (obj.type !== "Complete") {
      continue;
    }
    const payload = (obj.payload ?? {}) as Record<string, unknown>;
    // base/agent upstream shape: payload.cards.{responseMode,summary}
    const cards = (payload.cards ?? {}) as Record<string, unknown>;
    const responseMode = typeof cards.responseMode === "string" ? cards.responseMode : undefined;
    const summary = typeof cards.summary === "string" ? cards.summary : undefined;
    return { responseMode, summary };
  }
  return {};
}

/**
 * Pull the user query text from a stored request body. The base/agent backend
 * nests it under `request.query` (the `{ request, debug }` envelope); v2/sdk keep it at
 * the top level. Returns undefined for card-click turns that carry no query.
 */
function extractQuery(request: unknown): string | undefined {
  if (request === null || typeof request !== "object") {
    return;
  }
  const obj = request as Record<string, unknown>;

  if (typeof obj.query === "string" && obj.query.trim().length > 0) {
    return obj.query;
  }

  const nested = obj.request;
  if (nested !== null && typeof nested === "object") {
    const nestedQuery = (nested as Record<string, unknown>).query;
    if (typeof nestedQuery === "string" && nestedQuery.trim().length > 0) {
      return nestedQuery;
    }
  }

  return;
}

async function readTraceFile(location: TraceLocation): Promise<AgentDebugTrace | null> {
  const searchId = sanitizeSegment(location.searchId);
  const traceId = sanitizeSegment(location.traceId);
  const file = path.join(DEBUG_SEARCH_DIR, searchId, `${traceId}.json`);

  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as AgentDebugTrace;
  } catch (err) {
    if (isNotFound(err)) {
      return null;
    }
    console.warn("[agent-debug-reader] failed to read trace", file, err);
    return null;
  }
}

/**
 * List every captured trace, newest first. Reads each file to derive the
 * Complete-frame summary and request query; fine for a dev tool with a handful
 * of traces.
 */
export async function listTraces(): Promise<AgentDebugTraceSummary[]> {
  let searchDirs: string[];
  try {
    searchDirs = await readdir(DEBUG_SEARCH_DIR);
  } catch (err) {
    if (isNotFound(err)) {
      return [];
    }
    throw err;
  }

  const summaries: AgentDebugTraceSummary[] = [];

  for (const searchId of searchDirs) {
    const dir = path.join(DEBUG_SEARCH_DIR, searchId);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    for (const fileName of files) {
      if (!fileName.endsWith(".json")) {
        continue;
      }
      const traceId = fileName.slice(0, -".json".length);
      const trace = await readTraceFile({ searchId, traceId });
      if (!trace) {
        continue;
      }
      summaries.push({
        capturedAt: trace.capturedAt,
        frameCount: trace.frameCount,
        outcome: trace.timings?.outcome,
        query: extractQuery(trace.request),
        searchId: trace.searchId,
        serviceLabel: trace.serviceLabel,
        totalMs: trace.timings?.totalMs,
        traceId: trace.traceId,
        ...summarizeCompleteFrame(trace.frames),
      });
    }
  }

  return summaries.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

/** Load a single trace by searchId + traceId, or null if it doesn't exist. */
export function readTrace(searchId: string, traceId: string): Promise<AgentDebugTrace | null> {
  return readTraceFile({ searchId, traceId });
}
