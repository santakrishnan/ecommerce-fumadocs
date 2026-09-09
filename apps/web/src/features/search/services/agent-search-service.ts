"use client";

import type { AgentVersion } from "@config/agent-backend";
import { devConsole } from "@shared/lib/dev-console";
import type {
  AgentSearchResponse,
  AgentSearchTurn,
  AgentSearchTurnBeat,
  AgentSearchTurnsCollection,
} from "../lib/agent-search-turns-collection";
import { isMockNotFoundSearchId } from "../lib/mock-not-found-search-ids";
import { classifyFollowUp } from "../lib/response-cards";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentSearchLocation {
  city?: string;
  country?: string;
  /** Optional — the search BFF applies DEFAULT_LOCATION when coordinates are absent. */
  latitude?: number;
  longitude?: number;
  state?: string;
  zipCode: string;
}

interface StatusEvent {
  beat?: string;
  message?: string;
  searchId: string;
  stage: string;
  type: "Status";
}

interface ToolCallEvent {
  beat?: string;
  message?: string;
  toolCallId: string;
  toolName: string;
  type: "ToolCall";
}

interface ToolResultEvent {
  beat?: string;
  message?: string;
  status: string;
  toolCallId: string;
  type: "ToolResult";
}

interface CompleteEvent {
  payload: {
    searchId: string;
    searchMode: AgentSearchTurn["searchMode"];
    response: unknown;
  };
  type: "Complete";
}

interface ErrorEvent {
  error: { code: string; message: string };
  type: "Error";
}

type AgentSearchEvent =
  | StatusEvent
  | ToolCallEvent
  | ToolResultEvent
  | CompleteEvent
  | ErrorEvent
  | { type: string };

export class SearchNotFoundError extends Error {
  readonly searchId: string;
  readonly turnId: string;

  constructor(searchId: string, turnId: string) {
    super(`Search session not found: ${searchId}`);
    this.name = "SearchNotFoundError";
    this.searchId = searchId;
    this.turnId = turnId;
  }
}

// ─── SSE stream reader ────────────────────────────────────────────────────────

const SSE_DATA_PREFIX = /^data:\s?/;
const SSE_MESSAGE_BOUNDARY = /\r?\n\r?\n/;
const SSE_LINE_BREAK = /\r?\n/;
const UUID_V4_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

// Parses the first `data:` line of an SSE message; undefined for comments/heartbeats/garbage.
function parseSseMessage(message: string): AgentSearchEvent | undefined {
  const dataLine = message
    .split(SSE_LINE_BREAK)
    .find((line) => line.startsWith("data: ") || line.startsWith("data:"));

  if (!dataLine) {
    return;
  }

  const payload = dataLine.replace(SSE_DATA_PREFIX, "").trim();
  if (!payload) {
    return;
  }

  try {
    return JSON.parse(payload) as AgentSearchEvent;
  } catch {
    return;
  }
}

async function* readAgentStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<AgentSearchEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE messages separated by double newline (CRLF or LF)
      const messages = buffer.split(SSE_MESSAGE_BOUNDARY);
      buffer = messages.pop() ?? "";

      for (const message of messages) {
        const event = parseSseMessage(message);
        if (event !== undefined) {
          yield event;
        }
      }
    }

    // Flush a trailing frame that closed without its \n\n terminator (e.g. cut at the deadline).
    buffer += decoder.decode();
    const trailing = parseSseMessage(buffer);
    if (trailing !== undefined) {
      yield trailing;
    }
  } finally {
    reader.releaseLock();
  }
}

function updateTurnStatus(
  collection: AgentSearchTurnsCollection,
  turnId: string,
  status: AgentSearchTurn["status"]
) {
  collection.update(turnId, (draft: AgentSearchTurn) => {
    draft.status = status;
  });
}

// ─── Beat aggregation ─────────────────────────────────────────────────────────
// Status/ToolCall/ToolResult events carry an optional `beat` (shopper-facing
// progress row id, e.g. "resolve") and `message`. Events sharing the same beat
// as the trailing entry update it in place; a new beat closes the trailing
// entry (active → done) before appending. Events with no `beat` are no-ops —
// not every Status frame advances the checklist.

/** Marks the trailing beat's status. No-op if there's no trailing active beat. */
export function closeTrailingBeat(
  beats: AgentSearchTurnBeat[],
  status: "done" | "error"
): AgentSearchTurnBeat[] {
  const last = beats.at(-1);
  if (!last || last.status !== "active") {
    return beats;
  }
  return [...beats.slice(0, -1), { ...last, status }];
}

export function upsertBeat(
  beats: AgentSearchTurnBeat[],
  update: { beat?: string; message?: string; status: "active" | "done" | "error" }
): AgentSearchTurnBeat[] {
  if (!update.beat) {
    return beats;
  }

  const last = beats.at(-1);
  if (last?.beat === update.beat) {
    const merged: AgentSearchTurnBeat = {
      beat: update.beat,
      message: update.message ?? last.message,
      status: update.status,
    };
    return [...beats.slice(0, -1), merged];
  }

  // A new beat started — close the prior trailing entry (if still active) as done.
  const closed = closeTrailingBeat(beats, "done");
  return [...closed, { beat: update.beat, message: update.message ?? "", status: update.status }];
}

const VALID_RESPONSE_MODES = new Set(["InventoryCards", "OptionCards", "ComparisonCards"]);

function isValidAgentSearchResponse(value: unknown): value is AgentSearchResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    "responseMode" in obj &&
    typeof obj.responseMode === "string" &&
    VALID_RESPONSE_MODES.has(obj.responseMode as string) &&
    "summary" in obj &&
    typeof obj.summary === "string"
  );
}

/**
 * Row context captured at submit time so a completing turn can be classified
 * as a follow-up of the row it was submitted against.
 */
interface FollowUpContext {
  anchorTurnId?: string;
  canonicalCardIds: readonly string[];
  canonicalFilters?: Array<{
    key: string;
    value?: string | number | boolean;
    values?: Array<string | number>;
    min?: number;
    max?: number;
  }>;
  source: NonNullable<AgentSearchTurn["source"]>;
}

function handleSearchEvent(
  event: AgentSearchEvent,
  collection: AgentSearchTurnsCollection,
  turnId: string,
  followUp: FollowUpContext
) {
  switch (event.type) {
    case "Status": {
      const statusEvent = event as StatusEvent;
      collection.update(turnId, (draft: AgentSearchTurn) => {
        draft.status = "streaming";
        draft.beats = upsertBeat(draft.beats ?? [], {
          beat: statusEvent.beat,
          message: statusEvent.message,
          status: "active",
        });
      });
      break;
    }

    case "ToolCall": {
      const toolCallEvent = event as ToolCallEvent;
      collection.update(turnId, (draft: AgentSearchTurn) => {
        draft.beats = upsertBeat(draft.beats ?? [], {
          beat: toolCallEvent.beat,
          message: toolCallEvent.message,
          status: "active",
        });
      });
      break;
    }

    case "ToolResult": {
      const toolResultEvent = event as ToolResultEvent;
      collection.update(turnId, (draft: AgentSearchTurn) => {
        draft.beats = upsertBeat(draft.beats ?? [], {
          beat: toolResultEvent.beat,
          message: toolResultEvent.message,
          status: toolResultEvent.status === "Error" ? "error" : "done",
        });
      });
      break;
    }

    case "Complete": {
      const completeEvent = event as CompleteEvent;
      const rawResponse = completeEvent.payload.response;

      if (!isValidAgentSearchResponse(rawResponse)) {
        devConsole.error(
          "[handleSearchEvent] invalid Complete payload — marking turn as error",
          rawResponse
        );
        updateTurnStatus(collection, turnId, "error");
        break;
      }

      const validResponse = rawResponse;
      // Classify against the row this turn was submitted against. A follow-up
      // folds into its anchor's row instead of opening a new one.
      const { isFollowUp, matchedCardIds } = classifyFollowUp(
        followUp.source,
        Boolean(followUp.anchorTurnId),
        followUp.canonicalCardIds,
        validResponse,
        followUp.canonicalFilters
      );
      collection.update(turnId, (draft: AgentSearchTurn) => {
        draft.status = "complete";
        draft.searchMode = completeEvent.payload.searchMode;
        draft.response = validResponse;
        draft.beats = closeTrailingBeat(draft.beats ?? [], "done");
        if (isFollowUp && followUp.anchorTurnId) {
          draft.parentTurnId = followUp.anchorTurnId;
          if (matchedCardIds.length > 0) {
            draft.matchedCardIds = matchedCardIds;
          }
        }
      });
      break;
    }

    case "Error": {
      const errorEvent = event as ErrorEvent;
      collection.update(turnId, (draft: AgentSearchTurn) => {
        draft.status = "error";
        draft.errorCode = errorEvent.error.code;
        draft.errorMessage = errorEvent.error.message;
        draft.beats = closeTrailingBeat(draft.beats ?? [], "error");
      });
      break;
    }

    default:
      // Delta (ignored), keepalive — no UI action needed
      break;
  }
}

function shouldPersistOptimisticTurn(searchId: string): boolean {
  return UUID_V4_REGEX.test(searchId);
}

interface OptimisticTurnFields {
  autoSubmitted?: boolean;
  label?: string;
  query?: string;
  refinementNotification?: string;
  searchId: string;
  source: NonNullable<AgentSearchTurn["source"]>;
  turnId: string;
}

function insertOptimisticTurn(
  collection: AgentSearchTurnsCollection,
  {
    turnId,
    searchId,
    query,
    refinementNotification,
    autoSubmitted,
    label,
    source,
  }: OptimisticTurnFields
) {
  collection.insert({
    id: turnId,
    searchId,
    role: "user",
    ...(query ? { query } : {}),
    status: "pending",
    submittedAt: Date.now(),
    ...(refinementNotification ? { refinementNotification } : {}),
    ...(autoSubmitted ? { autoSubmitted } : {}),
    ...(label ? { label } : {}),
    ...(source ? { source } : {}),
  });
}

function handleNotFoundResponse(
  response: Response,
  collection: AgentSearchTurnsCollection,
  turnId: string,
  searchId: string,
  canPersistOptimisticTurn: boolean
) {
  if (response.status !== 404) {
    return;
  }

  if (canPersistOptimisticTurn) {
    collection.delete(turnId);
  }

  throw new SearchNotFoundError(searchId, turnId);
}

function assertMockNotFoundResponse(searchId: string, canPersistOptimisticTurn: boolean) {
  if (!canPersistOptimisticTurn && isMockNotFoundSearchId(searchId)) {
    throw new Error(`Mock not-found search id did not return 404: ${searchId}`);
  }
}

function handleNonStreamingResponse(
  response: Response,
  collection: AgentSearchTurnsCollection,
  turnId: string,
  searchId: string,
  canPersistOptimisticTurn: boolean
): string | null {
  handleNotFoundResponse(response, collection, turnId, searchId, canPersistOptimisticTurn);
  assertMockNotFoundResponse(searchId, canPersistOptimisticTurn);

  if (response.ok && response.body) {
    return null;
  }

  if (canPersistOptimisticTurn) {
    updateTurnStatus(collection, turnId, "error");
  }

  return turnId;
}

function markTurnAborted(
  collection: AgentSearchTurnsCollection,
  turnId: string,
  canPersistOptimisticTurn: boolean
) {
  if (!canPersistOptimisticTurn) {
    return;
  }

  collection.update(turnId, (draft: AgentSearchTurn) => {
    draft.status = "aborted";
  });
}

interface IncompleteStreamParams {
  canPersistOptimisticTurn: boolean;
  clientEventCount: number;
  lastEventType: string | undefined;
  searchId: string;
  turnId: string;
}

// Stream ended before the search finished — log what we last saw, mark the
// trailing beat as failed so the checklist shows a warning icon, then fail the turn.
function failTurnOnIncompleteStream(
  collection: AgentSearchTurnsCollection,
  {
    canPersistOptimisticTurn,
    clientEventCount,
    lastEventType,
    searchId,
    turnId,
  }: IncompleteStreamParams
): void {
  devConsole.error(
    `[submitAgentTurn] Search stream ended before completing — received ${clientEventCount} event(s), last was "${lastEventType ?? "none"}".`,
    { searchId, turnId }
  );
  if (canPersistOptimisticTurn) {
    collection.update(turnId, (draft: AgentSearchTurn) => {
      draft.beats = closeTrailingBeat(draft.beats ?? [], "error");
    });
    updateTurnStatus(collection, turnId, "error");
  }
}

function handleUnexpectedSubmitError(
  error: unknown,
  collection: AgentSearchTurnsCollection,
  turnId: string,
  canPersistOptimisticTurn: boolean
): string | null {
  if (error instanceof SearchNotFoundError) {
    throw error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    if (canPersistOptimisticTurn) {
      updateTurnStatus(collection, turnId, "aborted");
    }
    return turnId;
  }

  devConsole.error("[submitAgentTurn] unexpected error:", error);
  if (canPersistOptimisticTurn) {
    updateTurnStatus(collection, turnId, "error");
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SubmitAgentTurnParams {
  /**
   * Upstream agent version, resolved server-side and echoed back on the POST
   * body. The BFF forwards it untouched and uses it only to pick the
   * response mapper — never read directly from the client (httpOnly cookie).
   */
  agentVersion: AgentVersion;
  /**
   * Anchor turn id of the row this turn is submitted against. When the turn
   * completes as a follow-up, its parentTurnId is set to this id.
   */
  anchorTurnId?: string;
  /** Optional flag marking turns auto-submitted by card click or session recovery. */
  autoSubmitted?: boolean;
  /** Canonical (non-pill) card ids of the current row, used for follow-up matching. */
  canonicalCardIds?: readonly string[];
  /** Response-level filters from the current row's latest completed turn. */
  canonicalFilters?: Array<{
    key: string;
    value?: string | number | boolean;
    values?: Array<string | number>;
    min?: number;
    max?: number;
  }>;
  collection: AgentSearchTurnsCollection;
  /**
   * Display label for the intent eyebrow when the turn has no query text —
   * e.g. the title of a clicked card. Persisted on the optimistic turn.
   */
  label?: string;
  /** Visitor location (required by the API). */
  location: AgentSearchLocation;
  /** Full nextSearchPlan to forward (all fields spread into the POST body). */
  plan?: {
    filters?: Array<{
      key: string;
      max?: number;
      min?: number;
      value?: string | number | boolean;
      values?: Array<string | number>;
    }>;
    [key: string]: unknown;
  };
  /** The user's natural-language search query. */
  query?: string;
  /** Optional notification text for preference-removal refinement turns. */
  refinementNotification?: string;
  /** Conversation session UUID (caller manages; passed back on subsequent turns). */
  searchId: string;
  /** AbortSignal for cancellation. */
  signal: AbortSignal;
  /** What triggered this turn (query/card/pill/filters/auto). */
  source: NonNullable<AgentSearchTurn["source"]>;
  /** Turn id — generated fresh when omitted. */
  turnId?: string;
}

/**
 * Submits a single conversational turn to POST /api/search/agent.
 *
 * Immediately inserts a "pending" turn into the collection (optimistic),
 * then drives the SSE stream into collection mutations:
 *   Status/ToolCall/ToolResult → beats checklist updated
 *   Complete → full response stored, status set to "complete"
 *   Error  → status set to "error"
 *
 * The hook and components only read from useLiveQuery — they never touch
 * the stream directly. All state lives in the collection.
 */
export async function submitAgentTurn({
  query,
  searchId,
  location,
  signal,
  collection,
  turnId = crypto.randomUUID(),
  refinementNotification,
  autoSubmitted,
  label,
  source,
  anchorTurnId,
  canonicalCardIds = [],
  canonicalFilters,
  plan,
  agentVersion,
}: SubmitAgentTurnParams): Promise<string> {
  const canPersistOptimisticTurn = shouldPersistOptimisticTurn(searchId);

  // Step 1: optimistic insert — renders the pending bubble immediately
  if (canPersistOptimisticTurn) {
    insertOptimisticTurn(collection, {
      turnId,
      searchId,
      query,
      refinementNotification,
      autoSubmitted,
      label,
      source,
    });
  }

  try {
    const response = await fetch("/api/v1/search/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...plan,
        searchId,
        ...(query ? { query } : {}),
        location,
        agentVersion,
      }),
      signal,
    });

    const nonStreamingResponseResult = handleNonStreamingResponse(
      response,
      collection,
      turnId,
      searchId,
      canPersistOptimisticTurn
    );
    if (nonStreamingResponseResult) {
      return nonStreamingResponseResult;
    }

    const responseBody = response.body;
    if (!responseBody) {
      return turnId;
    }

    // Step 2: stream SSE events → collection mutations
    let clientCompleteSeen = false;
    let clientEventCount = 0;
    let lastEventType: string | undefined;

    for await (const event of readAgentStream(responseBody)) {
      if (signal.aborted) {
        break;
      }

      clientEventCount++;
      lastEventType = event.type;
      if (event.type === "Complete" || event.type === "Error") {
        clientCompleteSeen = true;
      }
      handleSearchEvent(event, collection, turnId, {
        source,
        anchorTurnId,
        canonicalCardIds,
        canonicalFilters,
      });
    }

    // If the signal was aborted mid-stream, mark the turn as aborted so it
    // is excluded from the rendered thread but preserved in IDB for potential
    // future recovery.
    if (signal.aborted) {
      markTurnAborted(collection, turnId, canPersistOptimisticTurn);
    }

    if (!(signal.aborted || clientCompleteSeen)) {
      failTurnOnIncompleteStream(collection, {
        canPersistOptimisticTurn,
        clientEventCount,
        lastEventType,
        searchId,
        turnId,
      });
    }
  } catch (error: unknown) {
    const errorResult = handleUnexpectedSubmitError(
      error,
      collection,
      turnId,
      canPersistOptimisticTurn
    );
    if (errorResult) {
      return errorResult;
    }
  }
  return turnId;
}
