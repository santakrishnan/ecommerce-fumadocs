import type {
  AgentSearchResponse,
  AgentSearchTurn,
  NextSearchPlan,
} from "./agent-search-turns-collection";

// ─── Card id extraction ───────────────────────────────────────────────────────

/**
 * Reads a stable id from any card shape in a response.
 *
 * V2 cards: inventory → `vin`, option / comparison → `id`.
 * Base mapped cards: `id` (inventory, spec, pill).
 * Returns undefined when the card carries no usable id (e.g. an id-less pill).
 */
function cardId(card: unknown): string | undefined {
  if (typeof card !== "object" || card === null) {
    return;
  }
  const record = card as Record<string, unknown>;
  if (typeof record.vin === "string") {
    return record.vin;
  }
  if (typeof record.id === "string") {
    return record.id;
  }
  return;
}

/**
 * Stable ids of a response's non-pill cards, in order. Pills are suggestion
 * chips rather than card references, so they never count toward follow-up
 * matching. Cards without an id are skipped.
 *
 * Works across legacy V2 and base-mapped shapes: only base-mapped cards carry
 * a `type` field, so V2 cards are never treated as pills. Legacy cards missing
 * the fields we read simply fall through as plain, non-pill cards.
 */
export function getNonPillCardIds(response: AgentSearchResponse | undefined): string[] {
  const results = response?.results;
  if (!results) {
    return [];
  }
  const ids: string[] = [];
  for (const card of results) {
    if ((card as { type?: string }).type === "pill") {
      continue;
    }
    const id = cardId(card);
    if (id) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * True when a response carries at least one card and *every* card is a pill.
 * Only base-mapped responses contain pills; legacy V2 responses always return
 * false here.
 */
export function isAllPills(response: AgentSearchResponse | undefined): boolean {
  const results = response?.results;
  if (!results || results.length === 0) {
    return false;
  }
  return results.every((card) => (card as { type?: string }).type === "pill");
}

// ─── Follow-up classification ─────────────────────────────────────────────────

/**
 * The turn that owns a row's *canonical* cards: the first turn in the chain
 * (anchor followed by its follow-ups, in submit order) that carries at least
 * one non-pill card. Undefined while the row is still exploring (pills / text
 * only). The row renders this turn's cards regardless of which turn produced
 * them.
 */
export function getCanonicalCardTurn(
  rowTurns: readonly AgentSearchTurn[]
): AgentSearchTurn | undefined {
  return rowTurns.find((turn) => getNonPillCardIds(turn.response).length > 0);
}

export interface FollowUpClassification {
  /** Whether the completed turn is a follow-up of its row. */
  isFollowUp: boolean;
  /** The single canonical card this follow-up drills into — focused when latest. */
  matchedCardIds: string[];
}

/**
 * Decides whether a just-completed turn is a follow-up of the current row.
 *
 * A row is "exploring" until its first non-pill cards arrive (its canonical
 * cards); after that it is "resolved". A follow-up stays in the row instead of
 * opening a new one:
 *
 * - source "card" / "filters" → always a new turn (explicit UX override)
 * - no row to attach to → new turn (this turn starts a row)
 * - row exploring (no canonical cards yet) → follow-up. Text, pills, or the
 *   first real cards all continue the same row; the first card-bearing response
 *   becomes the canonical cards.
 * - row resolved → follow-up only when the response is exactly one card already
 *   in the canonical set ("more about a single card"); anything else is a new turn.
 */
export function classifyFollowUp(
  source: AgentSearchTurn["source"],
  anchorExists: boolean,
  canonicalCardIds: readonly string[],
  newResponse: AgentSearchResponse,
  canonicalFilters?: CurrentRowContext["canonicalFilters"]
): FollowUpClassification {
  const notFollowUp: FollowUpClassification = { isFollowUp: false, matchedCardIds: [] };

  // Filter refinement always opens a new turn.
  if (source === "filters") {
    return notFollowUp;
  }
  // No row to attach to — this turn starts a new row.
  if (!anchorExists) {
    return notFollowUp;
  }

  // Card click: if the response produces no new non-pill cards, treat it as a
  // follow-up so the text stacks below the existing conversation while the
  // parent row's carousel persists on the right. If the response has its own
  // cards, it opens a new row as before.
  if (source === "card") {
    const newCardIds = getNonPillCardIds(newResponse);
    if (newCardIds.length === 0 && canonicalCardIds.length > 0) {
      // Text-only response from a card click — follow-up of the current row
      return { isFollowUp: true, matchedCardIds: [] };
    }
    // Response has its own cards — new row (original behavior)
    return notFollowUp;
  }

  // Exploring: the row has no canonical cards yet. Every response — text, pills,
  // or the first real cards — continues the same row as a follow-up. The first
  // card-bearing response becomes the row's canonical cards (derived elsewhere).
  if (canonicalCardIds.length === 0) {
    return { isFollowUp: true, matchedCardIds: [] };
  }

  // Resolved: only "more about a single card" — exactly one returned card that
  // is already in the canonical set — is a follow-up. Pill-only, multi-card,
  // and unmatched responses are new turns.
  const newCardIds = getNonPillCardIds(newResponse);

  // Zero-card (text-only) response on a resolved row: fold it in as a follow-up
  // so the summary text stacks below the existing conversation and the parent
  // row's carousel persists on the right.
  if (newCardIds.length === 0) {
    return { isFollowUp: true, matchedCardIds: [] };
  }

  if (newCardIds.length !== 1) {
    return notFollowUp;
  }
  const [matchedId] = newCardIds;
  if (!(matchedId && canonicalCardIds.includes(matchedId))) {
    return notFollowUp;
  }

  // If the response's filters differ from the row's canonical filters, the
  // user refined their search (e.g. added a color filter that narrowed to one
  // result). That should render as a new turn, not a highlight.
  if (canonicalFilters && !filtersMatch(canonicalFilters, newResponse.nextSearchPlan?.filters)) {
    return notFollowUp;
  }

  return { isFollowUp: true, matchedCardIds: [matchedId] };
}

// ─── Current-row context (submit time) ───────────────────────────────────────

// ─── Filter comparison ───────────────────────────────────────────────────────

type FilterEntry = NonNullable<NextSearchPlan["filters"]>[number];

/**
 * Shallow comparison of two filter arrays. Order-independent — compares by
 * serialised filter entries. Returns true when both represent the same set of
 * filter constraints.
 */
function filtersMatch(
  a: NextSearchPlan["filters"] | undefined,
  b: NextSearchPlan["filters"] | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (!(a && b)) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  // Produce a stable string per filter entry: sort keys for object-key order
  // independence, sort values[] for element-order independence.
  const serialize = (f: FilterEntry) => {
    const normalized = { ...f };
    if (normalized.values) {
      normalized.values = [...normalized.values].sort();
    }
    return JSON.stringify(normalized, Object.keys(normalized).sort());
  };
  // Compare as sets — filter array order doesn't matter.
  const setA = new Set(a.map(serialize));
  return b.every((f) => setA.has(serialize(f)));
}

// ─── CurrentRowContext ───────────────────────────────────────────────────────

export interface CurrentRowContext {
  /** Anchor turn id of the latest row, or undefined when the thread is empty. */
  anchorTurnId: string | undefined;
  /** Canonical (non-pill) card ids of the latest row. */
  canonicalCardIds: string[];
  /**
   * The response-level nextSearchPlan.filters from the latest completed turn
   * in the current row. Used to detect filter changes between turns so we can
   * distinguish "drill into same card" from "refine filters that happen to
   * yield one result."
   */
  canonicalFilters: NextSearchPlan["filters"] | undefined;
}

/**
 * The latest row's anchor and canonical card ids, computed from the current
 * thread at submit time so a completing turn can be classified against the row
 * it might follow up on.
 *
 * The anchor is the most recent turn with no parentTurnId; the row is that
 * anchor plus any later turns that follow it. Canonical ids come from the row's
 * first card-bearing turn (getCanonicalCardTurn).
 */
export function getCurrentRowContext(turns: readonly AgentSearchTurn[]): CurrentRowContext {
  let anchor: AgentSearchTurn | undefined;
  for (const turn of turns) {
    if (!turn.parentTurnId && turn.status !== "error") {
      anchor = turn;
    }
  }
  if (!anchor) {
    return { anchorTurnId: undefined, canonicalCardIds: [], canonicalFilters: undefined };
  }
  const anchorId = anchor.id;
  const rowTurns = turns.filter((turn) => turn.id === anchorId || turn.parentTurnId === anchorId);
  const canonicalTurn = getCanonicalCardTurn(rowTurns);

  // Latest completed turn's response-level filters — represents the
  // accumulated filter state for this row.
  let canonicalFilters: NextSearchPlan["filters"] | undefined;
  for (const turn of rowTurns) {
    if (turn.status === "complete" && turn.response?.nextSearchPlan?.filters) {
      canonicalFilters = turn.response.nextSearchPlan.filters;
    }
  }

  return {
    anchorTurnId: anchorId,
    canonicalCardIds: getNonPillCardIds(canonicalTurn?.response),
    canonicalFilters,
  };
}
