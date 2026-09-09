import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type AgentDebugTrace,
  type AgentStreamTimings,
  DEBUG_SEARCH_DIR,
  sanitizeSegment,
  UNKNOWN_SEARCH_ID,
} from "./agent-debug-storage";

export interface AgentTraceCapture {
  /** Raw upstream frames, pushed in arrival order by the pipeline. */
  frames: unknown[];
  /** Persist the capture with the finished stream's timings. Never throws. */
  persist(timings: AgentStreamTimings): Promise<void>;
}

/**
 * Creates a capture handle for one agent stream. The pipeline fills `frames`
 * with the raw upstream SSE frames — before the loose Zod schemas strip unknown
 * keys — and calls `persist` once the stream settles, so the /debug/agent viewer
 * sees the true upstream payload plus its timeline. Only call when capture is
 * enabled (see AGENT_DEBUG_ENABLED).
 */
export function createAgentTraceCapture(
  serviceLabel: string,
  requestBody: unknown
): AgentTraceCapture {
  const traceId = crypto.randomUUID();
  const capturedAt = new Date().toISOString();
  const frames: unknown[] = [];

  return {
    frames,
    persist: (timings) =>
      persistTrace({ capturedAt, frames, request: requestBody, serviceLabel, timings, traceId }),
  };
}

/**
 * Best-effort scan for a searchId across captured frames.
 * Frames are stored as `{ receivedAt, frame }` envelopes.
 */
function extractSearchId(frames: unknown[]): string {
  for (const entry of frames) {
    const frame =
      entry !== null && typeof entry === "object"
        ? (entry as Record<string, unknown>).frame
        : entry;

    if (frame === null || typeof frame !== "object") {
      continue;
    }
    const obj = frame as Record<string, unknown>;

    if (typeof obj.searchId === "string" && obj.searchId.length > 0) {
      return obj.searchId;
    }

    const payload = obj.payload;
    if (payload !== null && typeof payload === "object") {
      const nested = (payload as Record<string, unknown>).searchId;
      if (typeof nested === "string" && nested.length > 0) {
        return nested;
      }
    }
  }
  return UNKNOWN_SEARCH_ID;
}

async function persistTrace({
  capturedAt,
  frames,
  request,
  serviceLabel,
  timings,
  traceId,
}: Pick<
  AgentDebugTrace,
  "capturedAt" | "frames" | "request" | "serviceLabel" | "timings" | "traceId"
>): Promise<void> {
  try {
    const searchId = sanitizeSegment(extractSearchId(frames));
    const dir = path.join(DEBUG_SEARCH_DIR, searchId);
    await mkdir(dir, { recursive: true });

    const record: AgentDebugTrace = {
      capturedAt,
      frameCount: frames.length,
      frames,
      request,
      searchId,
      serviceLabel,
      timings,
      traceId,
    };

    await writeFile(path.join(dir, `${traceId}.json`), JSON.stringify(record, null, 2), "utf8");
  } catch (err) {
    console.warn("[agent-debug-recorder] failed to persist trace", err);
  }
}
