"use client";

import { idbCollectionOptions } from "@shared/lib/client-only";
import { type Collection, createCollection } from "@tanstack/react-db";
import type { agentSearchResultSearchModeEnum } from "@ucmp/sdk-search-api";
import { z } from "zod";

// ─── Card payload interfaces ──────────────────────────────────────────────────

export interface AttributeOption {
  description?: string;
  label?: string;
  metadata?: unknown;
  value: string;
}

/**
 * Attribute value shapes — exactly one value field per entry.
 * Used inside OptionCard and ComparisonCard.
 */
export interface Attribute {
  description?: string;
  key: string;
  label: string;
  max?: string;
  min?: string;
  options?: AttributeOption[];
  value?: string;
}

/**
 * NextSearchPlan — carried on every card. Posted back to /search/agent
 * (next turn) or /search (paginated SRP "show all").
 *
 * Required fields are expected by the UI; additional backend-supplied properties
 * (e.g. searchMode, responseMode, optionLevel) pass through untouched
 * and are forwarded to the API on the next submission.
 */
export interface NextSearchPlan {
  filters: Array<{
    key: string;
    value?: string | number | boolean;
    values?: Array<string | number>;
    min?: number;
    max?: number;
  }>;
  location?: {
    zipCode: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
  };
  searchId: string;
  /** Index signature — extra backend fields survive IDB round-trips. */
  [key: string]: unknown;
}

// ─── Individual card interfaces (API shapes) ──────────────────────────────────

export interface InventoryCard {
  /** AI-generated one-line description (maps to BFF tags[].summary). */
  aiDescription?: string;
  dealerInfo: {
    dealerCode: string;
    dealerName: string;
    zipCode: string;
  };
  media?: {
    photos?: Array<{ url: string; displayOrder: number }>;
    videos?: unknown[];
    primaryImageUrl?: string;
    imageUrls?: string[];
  };
  pricing: {
    msrp?: number;
    listPrice?: number;
    sellingPrice?: number;
    finalPrice?: number;
    originalPrice?: number;
  };
  relevanceScore?: number;
  status: {
    mileage?: number;
    daysInStock?: number;
    vehicleStatus?: string;
    isCertified?: boolean;
  };
  stockNumber?: string;
  /** FE surface context — derived from image background for text contrast. */
  surface?: "light" | "dark";
  vehicleId?: number;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    exteriorColorFamily?: string;
    interiorColor?: string;
    fuelType?: string;
    drivetrain?: string;
    transmission?: string;
    mileage?: number;
    engine?: string;
    cityMpg?: number;
    hwyMpg?: number;
    isNew?: boolean;
    isActive?: boolean;
  };
  vin: string;
}

export interface OptionCard {
  attributes?: Attribute[];
  availableCount: number;
  highlights?: string[];
  id: string;
  image?: string;
  nextSearchPlan: NextSearchPlan;
  subtitle?: string;
  title: string;
}

/** Comparison metric shape (e.g. "Max cargo: 84.3 CU. FT."). */
export interface ComparisonMetric {
  label: string;
  unit?: string;
  value: string;
}

export interface ComparisonCard {
  attributes?: Attribute[];
  availableCount: number;
  /** Serializable badge icon name. */
  badgeIconName?: string;
  // ── Display-level fields (FE-proposed, optional) ────────────────────────
  /** AI badge label (e.g. "Most space", "Best for road trips"). */
  badgeLabel?: string;
  /** Short AI-generated description. */
  description?: string;
  highlights?: string[];
  id: string;
  image?: string;
  /** 1–2 comparison metrics (large numeric values displayed on card). */
  metrics?: ComparisonMetric[];
  nextSearchPlan: NextSearchPlan;
  subtitle?: string;
  title: string;
  /** Model year. */
  year?: string | number;
}

// ─── Action interface ─────────────────────────────────────────────────────────

export interface ResponseAction {
  href: string;
  label: string;
}

// ─── Response payload discriminated union ────────────────────────────────────

export interface InventoryCardsResponse {
  actions?: ResponseAction[];
  nextSearchPlan: NextSearchPlan;
  responseMode: "InventoryCards";
  results: InventoryCard[];
  summary: string;
  totalCount: number;
}

export interface OptionCardsResponse {
  actions?: ResponseAction[];
  nextSearchPlan: NextSearchPlan;
  optionLevel: "Category" | "Segment" | "Model" | "Trim" | "Package" | "Fallback";
  responseMode: "OptionCards";
  results: OptionCard[];
  summary: string;
  totalCount: number;
}

export interface ComparisonCardsResponse {
  actions?: ResponseAction[];
  nextSearchPlan: NextSearchPlan;
  responseMode: "ComparisonCards";
  results: ComparisonCard[];
  summary: string;
  totalCount: number;
}

export type AgentSearchResponse =
  | InventoryCardsResponse
  | OptionCardsResponse
  | ComparisonCardsResponse;

// ─── Beat interfaces ───────────────────────────────────────────────────────────

/**
 * A single shopper-facing progress row, keyed by the backend's `beat` id
 * (e.g. "resolve", "inventory", "options"). Populated from Status/ToolCall/
 * ToolResult events during streaming.
 *
 * - "active": currently in progress — rendered as plain text, no icon.
 * - "done": a later beat started, or the turn completed — rendered with a checkmark.
 * - "error": the tool for this beat reported a failure, or the stream closed
 *   before a Complete/Error event arrived while this beat was active —
 *   rendered with a warning icon instead of a checkmark.
 */
export interface AgentSearchTurnBeat {
  /** Backend beat id (e.g. "resolve", "inventory", "options"). */
  beat: string;
  /** Latest shopper-facing message for this beat. */
  message: string;
  status: "active" | "done" | "error";
}

// ─── Turn interface ───────────────────────────────────────────────────────────

/**
 * A single conversational turn. Starts as "pending" on submit, transitions
 * through "streaming" as SSE events arrive, and settles at "complete", "error",
 * or "aborted".
 *
 * All statuses are persisted to IDB. "aborted" turns are excluded from the
 * rendered thread. Turns left in "pending" or "streaming" when the page closes
 * are marked "aborted" on the next page load.
 */
export interface AgentSearchTurn {
  /**
   * True once the full centered→two-column reveal has played for this turn.
   * Persisted to IDB so the reveal never replays on reload, back-navigation,
   * or remount — the animation decision is derived entirely from turn state.
   * Only the first turn of a session is ever eligible for the reveal; every
   * other turn (and every restored turn) falls back to the minimal fade-in.
   */
  animationPlayed?: boolean;
  /**
   * True when this turn was auto-submitted (card click or zero-turn recovery)
   * rather than typed by the user. Used for logging/debugging.
   */
  autoSubmitted?: boolean;

  // ── Streaming-only (populated on Status/ToolCall/ToolResult) ────────────
  /**
   * Shopper-facing progress checklist, one row per `beat` seen so far, in
   * arrival order. Populated while status = "streaming"; left in place
   * (not cleared) once the turn completes so a re-render mid-transition
   * doesn't flash an empty list.
   */
  beats?: AgentSearchTurnBeat[];
  /** Internal upstream error code, retained for future code-specific copy. */
  errorCode?: string;
  /** Internal upstream error message, never rendered to shoppers. */
  errorMessage?: string;
  /** Client-generated UUID — unique per turn. */
  id: string;
  /**
   * Explicit grid variant override from backend (future). Takes precedence over count-based inference.
   * When backend provides this field, it should override the inferGridVariant() count-based logic.
   */
  inventoryGridVariant?: "14-cards-small" | "6-cards-mix" | "6-cards-small";
  /**
   * Display label for the intent eyebrow when the turn has no query text — e.g.
   * the title of a clicked card. Falls back behind `query` and
   * `refinementNotification` when building the eyebrow.
   */
  label?: string;
  /**
   * Canonical card ids this follow-up drilled into (currently at most one).
   * The latest follow-up's matched card is focused in the row's card panel.
   */
  matchedCardIds?: string[];
  // ── Follow-up model ────────────────────────────────────────────────────
  /**
   * The id of the anchor turn this turn follows up on. When set, the turn is
   * folded into the anchor's row instead of opening its own row. Absent on
   * turns that start a new row.
   */
  parentTurnId?: string;
  /** The raw query text submitted by the user. Optional for auto-submitted turns. */
  query?: string;
  /**
   * Human-readable notification text for preference-removal refinement turns
   * (e.g. "Removed: White color"). Persisted so the icon eyebrow survives reload.
   * Absent for regular (non-refinement) turns.
   */
  refinementNotification?: string;
  /**
   * Full response payload from CompleteEvent.payload.
   * Stored verbatim so the thread can be re-rendered without a server round-trip.
   */
  response?: AgentSearchResponse;
  /** Always "user" — the search model is request/response, not assistant-initiated. */
  role: "user";
  /** Conversation session ID. Client-generated on first turn; server echoes it back. */
  searchId: string;

  // ── Complete-only ────────────────────────────────────────────────────
  /** Whether the agent was navigating options or returning vehicles. */
  searchMode?:
    | typeof agentSearchResultSearchModeEnum.Exploration
    | typeof agentSearchResultSearchModeEnum.Inventory;
  /**
   * What triggered this turn. Drives follow-up classification and the
   * centered-reveal vs two-column layout: "card"/"filters" always open a new
   * row; "query"/"pill"/"auto" may fold into the current row as follow-ups.
   */
  source?: "query" | "card" | "pill" | "filters" | "auto";
  /** Lifecycle status of the turn. */
  status: "queued" | "pending" | "streaming" | "complete" | "error" | "aborted";
  /** UTC ms timestamp when the turn was submitted. */
  submittedAt: number;
}

// ─── Visitor-scoped collection factory ───────────────────────────────────────

type AgentSearchTurnsCollection = Collection<AgentSearchTurn, string>;

export type { AgentSearchTurnsCollection };

/**
 * Minimal validation for IDB rehydration and mutation safety.
 * Allows additional fields via `.passthrough()`.
 */
const agentSearchTurnPassthroughSchema: z.ZodType<AgentSearchTurn> = z
  .object({
    id: z.string(),
    searchId: z.string(),
    role: z.literal("user"),
    status: z.enum(["queued", "pending", "streaming", "complete", "error", "aborted"]),
    submittedAt: z.number(),
  })
  .passthrough() as unknown as z.ZodType<AgentSearchTurn>;

let _current: {
  visitorId: string;
  collection: AgentSearchTurnsCollection;
  clearStore: () => Promise<void>;
} | null = null;

/**
 * Returns the agent search turns collection scoped to the given visitorId.
 * Creates a new instance only when visitorId changes.
 *
 * visitorId is required — use useAgentSearchTurnsCollection() to obtain it
 * via React context rather than calling this directly.
 *
 * Partition key is `${visitorId}.${turn.searchId}` so:
 * - Capacity (50 turns) is enforced per visitor+session
 * - Purge/eviction never crosses session or visitor boundaries
 */
export function getAgentSearchTurnsCollection(visitorId: string): {
  visitorId: string;
  collection: AgentSearchTurnsCollection;
  clearStore: () => Promise<void>;
} {
  if (_current?.visitorId !== visitorId) {
    const { config, clearStore } = idbCollectionOptions({
      id: `agent-search-turns.${visitorId}`,
      storeName: "agent-search-turns",
      schema: agentSearchTurnPassthroughSchema,
      getKey: (turn) => turn.id,
      getPartitionKey: (turn) => `${visitorId}.${turn.searchId}`,
      ttl: 86_400_000, // 24 hours
      capacity: 50, // 50 turns per session
      // Turns left in pending/streaming when the page closed will never
      // resolve — mark them aborted on load so they don't appear stuck in
      // the UI.
      transformOnLoad: (turn) =>
        turn.status === "pending" || turn.status === "streaming"
          ? { ...turn, status: "aborted" as const }
          : turn,
    });
    _current = {
      visitorId,
      collection: createCollection(config) as unknown as AgentSearchTurnsCollection,
      clearStore,
    };
  }
  return _current;
}
