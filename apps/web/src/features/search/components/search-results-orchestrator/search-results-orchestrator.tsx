"use client";

import type { SearchPreferencesPopoverProps } from "@features/landing/components/search-prompt";
import { SearchPromptClient } from "@features/landing/components/search-prompt/search-prompt-client";
import { useIsMobile } from "@features/landing/hooks/use-is-mobile";
import { PageGrid } from "@ucmp/ui";
import { IconPreferences } from "@ucmp/ui/icons";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import type { SelectedContextFilter } from "~/features/search/bff/contracts/filters-response.schema";
import { apiAutocompleteService } from "~/features/search/services/api-autocomplete-service";
import { useSearchConversationalContext } from "../../context/search-conversational-context";
import { useAgentSearchTurns } from "../../hooks/use-agent-search-turns";
import {
  type AutoSubmitHandlerStatus,
  useAutoSubmitTurnHandler,
} from "../../hooks/use-auto-submit-turn-handler";
import type { SubmitTurnOptions } from "../../hooks/use-ephemeral-agent-search-turns";
import { useEphemeralAgentSearchTurns } from "../../hooks/use-ephemeral-agent-search-turns";
import { usePrefetchFilters } from "../../hooks/use-prefetch-filters";
import { useSearchLocation } from "../../hooks/use-search-location";
import { useSearchPreferencesRefinement } from "../../hooks/use-search-preferences-refinement";
import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import { createResultCardRenderer } from "../../lib/render-result-card";
import { getCanonicalCardTurn } from "../../lib/response-cards";
import { storeSearchFilters } from "../../services/store-search-filters";
import { ConversationalLayout } from "../conversational-layout";
import { ActiveTurnRow } from "./active-turn-row";
import { CompletedTurnRow } from "./completed-turn-row";
import { TurnSkeleton } from "./turn-skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * External turn data source. When provided via `turnProvider`, the orchestrator
 * skips its built-in hooks (SSE / IDB) and renders with the supplied data.
 * Used by the VDP FAQ overlay to feed BFF responses into the search UI.
 */
export interface TurnProvider {
  isLoading: boolean;
  isStreaming: boolean;
  /** Mark a turn's full reveal as played so it never replays. Optional for external providers. */
  markTurnAnimated?: (turnId: string) => void;
  submitTurn: (options: SubmitTurnOptions) => void;
  turns: AgentSearchTurn[];
}

export interface SearchResultsOrchestratorProps {
  /**
   * When false, the first active turn skips the centered→left animation and
   * starts in the two-column (left-aligned) layout immediately.
   * @default true
   */
  animateFromCentered?: boolean;
  /**
   * When true, the active turn's response text reveals word by word.
   * Defaults to false — the main search results page shows text immediately.
   * Enabled for the VDP "Ask a question" overlay to preserve its prior streaming feel.
   */
  animateText?: boolean;
  /**
   * When true, turns are held in component state instead of IDB-backed collection.
   * The hook mints its own searchId on mount — the `searchId` prop is ignored.
   */
  ephemeral?: boolean;
  /** Custom header slot rendered above the thread (e.g. vehicle info in VDP overlay) */
  header?: ReactNode;
  /** Hide the preferences button in the search prompt */
  hidePreferences?: boolean;
  /** Auto-submit this query on mount (seeds a turn without user typing) */
  initialQuery?: string;
  /** Called when the session resolves with no turns (replaces router.replace("/search")) */
  onEmpty?: () => void;
  placeholder?: string | string[];
  /** Render all result cards in read-only mode (no links, no click handlers). */
  readOnly?: boolean;
  /**
   * Provide searchId directly instead of reading from route params.
   * When provided, the route param is ignored. Ignored when `ephemeral` is true.
   */
  searchId?: string;
  /**
   * External turn data source. When provided, the orchestrator uses this
   * instead of its built-in SSE/IDB hooks. Takes precedence over `ephemeral`.
   */
  turnProvider?: TurnProvider;
}

/** Props passed from the hook-mounting wrappers to the shared content renderer. */
interface OrchestratorContentProps {
  animateFromCentered?: boolean;
  animateText?: boolean;
  /** Whether the auto-submit gate has resolved (always "done" in ephemeral mode). */
  autoSubmitStatus: AutoSubmitHandlerStatus;
  header?: ReactNode;
  hidePreferences?: boolean;
  initialQuery?: string;
  isEphemeral: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  /** Mark a turn's full reveal as played so it never replays (persisted in IDB mode). */
  markTurnAnimated?: (turnId: string) => void;
  onEmpty?: () => void;
  placeholder?: string | string[];
  readOnly?: boolean;
  /**
   * URL `[id]` param for the current search session. Provided only in
   * persisted mode — undefined in ephemeral (VDP overlay) mode.
   */
  searchId?: string;
  submitTurn: (options: SubmitTurnOptions) => void;
  turns: AgentSearchTurn[];
}

/**
 * Splits settled turns into row-owner turns and a map of follow-ups keyed by
 * their anchor (parentTurnId). Follow-ups render inside their anchor's row
 * rather than as their own row. Turns arrive ordered by submittedAt asc, so
 * each follow-up list stays ordered oldest → newest.
 */
function groupFollowUps(settledTurns: AgentSearchTurn[]): {
  followUpsByParent: Map<string, AgentSearchTurn[]>;
  rowTurns: AgentSearchTurn[];
} {
  const followUpsByParent = new Map<string, AgentSearchTurn[]>();
  const rowTurns: AgentSearchTurn[] = [];
  for (const turn of settledTurns) {
    if (turn.parentTurnId) {
      const followUps = followUpsByParent.get(turn.parentTurnId) ?? [];
      followUps.push(turn);
      followUpsByParent.set(turn.parentTurnId, followUps);
    } else {
      rowTurns.push(turn);
    }
  }
  return { rowTurns, followUpsByParent };
}

/** The preference-refinement eyebrow (icon + notification text), if any. */
function buildRefinementEyebrow(
  turn: AgentSearchTurn
): { icon: ReactNode; text: string } | undefined {
  return turn.refinementNotification
    ? { text: turn.refinementNotification, icon: <IconPreferences className="size-5" /> }
    : undefined;
}

// ─── Shared Content Renderer ──────────────────────────────────────────────────

/**
 * Pure rendering logic for the orchestrator. Receives turn data and actions
 * as props — no awareness of IDB vs in-memory storage.
 */
function OrchestratorContent({
  animateFromCentered: animateFromCenteredProp = true,
  animateText,
  autoSubmitStatus,
  header,
  hidePreferences,
  initialQuery,
  isEphemeral,
  isLoading,
  isStreaming,
  markTurnAnimated,
  onEmpty,
  placeholder,
  readOnly,
  searchId,
  submitTurn,
  turns,
}: OrchestratorContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const ctx = useSearchConversationalContext();
  const router = useRouter();

  const promptKeyRef = useRef(0);
  const submitTurnRef = useRef(submitTurn);
  submitTurnRef.current = submitTurn;

  // Real visitor location. Held in a ref so the delayed initial submit reads
  // the latest value without re-triggering on resolution.
  const { location, filterLocation } = useSearchLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  // When readOnly, supply the non-interactive card renderer to turn rows.
  const readOnlyRenderItem = readOnly
    ? createResultCardRenderer(submitTurn, { readOnly: true })
    : undefined;

  // Submit initialQuery — delayed to let expand animation + content mount
  useEffect(() => {
    if (!initialQuery) {
      return;
    }
    const timer = setTimeout(() => {
      submitTurnRef.current({
        query: initialQuery,
        location: locationRef.current,
        source: "query",
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [initialQuery]);

  // Tailwind `lg` breakpoint = 1024px.
  const isBelowLg = useIsMobile(1023);
  const promptVariant: "docked" | "inline" = isBelowLg ? "docked" : "inline";

  const lastTurnQuery = turns.at(-1)?.query;

  // ── Turn segmentation ──────────────────────────────────────────────────────
  // Separate the active-slot turn (right column) from settled completed-row
  // turns. Follow-ups are nested inside their parent row. An optional
  // "overlay" pending turn shows a loading spinner atop the active slot while
  // the next search is in flight.
  const { rowTurns, followUpsByParent } = groupFollowUps(
    turns.filter((t) => t.status === "complete" || t.status === "error")
  );
  const lastCompleteRowTurn = rowTurns.at(-1);
  const completedTurns = rowTurns.slice(0, -1);
  const overlayPendingTurn = turns.find((t) => t.status === "pending" || t.status === "streaming");
  // When no complete turn occupies the active slot yet (first search in session),
  // the in-flight turn fills the slot directly instead of as an overlay.
  const activeSlotTurn = lastCompleteRowTurn ?? overlayPendingTurn;

  // ── Animation decision (derived purely from turn state) ─────────────────────
  // The full centered→two-column reveal plays only for the very first turn of
  // the session, and only while that turn has not yet recorded a reveal. State
  // lives on the turn itself (persisted in IDB), so a reload, back-navigation,
  // or remount all read `animationPlayed === true` and fall back to the fade-in.
  // Every later turn is not the first turn, so it never reveals either.
  const firstTurnId = rowTurns[0]?.id ?? overlayPendingTurn?.id;
  const isFirstActiveTurn = Boolean(activeSlotTurn) && activeSlotTurn?.id === firstTurnId;
  const animateFromCentered =
    animateFromCenteredProp && isFirstActiveTurn && !activeSlotTurn?.animationPlayed;

  // Record the reveal on the turn as soon as we commit to playing it, so it is
  // never replayed (subsequent turns, reload, or back-navigation all read it
  // back as already played). ActiveTurnRow captures the decision at mount, so
  // this persistence flipping the value mid-reveal won't interrupt the running
  // animation.
  useEffect(() => {
    if (animateFromCentered && activeSlotTurn) {
      markTurnAnimated?.(activeSlotTurn.id);
    }
  }, [animateFromCentered, activeSlotTurn, markTurnAnimated]);

  // Prompt bar centering: mirrors ActiveTurnRow's centered→left transition.
  // Centered while first turn has no real cards; transitions left after 1050ms
  // once cards arrive. Pill-only responses stay centered permanently.
  const activeRowTurns = activeSlotTurn
    ? [activeSlotTurn, ...(followUpsByParent.get(activeSlotTurn.id) ?? [])]
    : [];
  const activeHasCards = Boolean(getCanonicalCardTurn(activeRowTurns));
  const [cardsVisible, setCardsVisible] = useState(!animateFromCentered);
  useEffect(() => {
    if (cardsVisible || !activeHasCards) {
      return;
    }
    const timer = setTimeout(() => setCardsVisible(true), 1050);
    return () => clearTimeout(timer);
  }, [activeHasCards, cardsVisible]);

  // Persist the last completed turn's nextSearchPlan filters to the server
  // so the results page can hydrate its initial SSR load without URL params.
  const lastSavedTurnIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isEphemeral || !searchId) {
      return;
    }
    const plan = activeSlotTurn?.response?.nextSearchPlan;
    if (!(plan && activeSlotTurn) || activeSlotTurn.id === lastSavedTurnIdRef.current) {
      return;
    }
    lastSavedTurnIdRef.current = activeSlotTurn.id;
    storeSearchFilters(searchId, plan.filters as SelectedContextFilter[]);
  }, [activeSlotTurn, isEphemeral, searchId]);

  // ── Prefetch filters as soon as any turn has a "See all results" plan ──
  const seeAllSearchId = turns.find(
    (turn) => turn.status === "complete" && turn.response?.nextSearchPlan
  )?.response?.nextSearchPlan?.searchId;
  usePrefetchFilters(Boolean(seeAllSearchId), filterLocation, seeAllSearchId);

  const { resetRefinement, searchPreferences, markRefinementTurn } = useSearchPreferencesRefinement(
    {
      isStreaming,
      lastTurnQuery,
      submitTurn,
      turns,
    }
  );

  // Redirect to home only after the gate resolves and no turns exist.
  // Skip when initialQuery is provided — the auto-submit will create a turn momentarily.
  // Skip in ephemeral mode — the overlay starts with zero turns and never uses IDB.
  useEffect(() => {
    if (isEphemeral || initialQuery) {
      return;
    }
    if (autoSubmitStatus === "done" && !isLoading && turns.length === 0) {
      if (onEmpty) {
        onEmpty();
      } else {
        router.replace("/");
      }
    }
  }, [autoSubmitStatus, isLoading, turns.length, router, onEmpty, initialQuery, isEphemeral]);

  // Scroll the active row to the top whenever it changes identity (a new
  // resolved turn or a promoted hard-new-row). Track scrolling so the
  // just-demoted completed row hides its content until the scroll settles.
  // The very first scroll (initial mount from restored turns / reload / back-
  // navigation) is instant so the thread doesn't animate into place; every
  // later turn change scrolls smoothly.
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    const container = scrollRef.current;
    const lastTurn = lastTurnRef.current;
    if (!(container && lastTurn)) {
      return;
    }

    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
      container.scrollTo({ top: lastTurn.offsetTop, behavior: "instant" });
      return;
    }

    setIsScrolling(true);
    container.scrollTo({ top: lastTurn.offsetTop, behavior: "smooth" });

    let settled = false;
    const settle = () => {
      if (settled) {
        return;
      }
      settled = true;
      setIsScrolling(false);
      clearTimeout(fallbackTimer);
      container.removeEventListener("scrollend", settle);
    };

    container.addEventListener("scrollend", settle, { once: true });
    // Fallback: if scrollend never fires (no delta, or unsupported browser),
    // clear isScrolling after a generous timeout.
    const fallbackTimer = setTimeout(settle, 600);

    return () => {
      settled = true;
      clearTimeout(fallbackTimer);
      container.removeEventListener("scrollend", settle);
    };
  }, [activeSlotTurn?.id]);

  // Mark the newest turn as a refinement turn if one was pending.
  const prevTurnCountRef = useRef(turns.length);
  useEffect(() => {
    if (turns.length > prevTurnCountRef.current) {
      const newestTurn = turns.at(-1);
      if (newestTurn) {
        markRefinementTurn();
      }
    }
    prevTurnCountRef.current = turns.length;
  }, [turns.length, markRefinementTurn]);

  // Transition state back once a refinement turn finishes streaming.
  useEffect(() => {
    if (!isStreaming && ctx?.searchConversationalState === "refinement") {
      ctx.setSearchConversationalState("results-generated");
    }
  }, [isStreaming, ctx?.searchConversationalState]);

  const handleUserSearch = (query: string) => {
    resetRefinement();
    ctx?.setSearchConversationalState("results-generated");
    submitTurn({ query, location, source: "query" });
    promptKeyRef.current += 1;
  };

  const searchPreferencesProps: SearchPreferencesPopoverProps | undefined = hidePreferences
    ? undefined
    : searchPreferences;

  return (
    <ConversationalLayout
      promptBar={
        <div
          className={cn(
            "absolute bottom-0 w-full shrink-0 animate-slide-up-delayed pt-3 pb-10 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-10 lg:shrink lg:bg-none"
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[185px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.57)_35%,#000_100%)] lg:hidden"
          />
          <PageGrid>
            <div
              className={cn(
                "col-span-full md:col-span-8 lg:pointer-events-none lg:col-span-12 lg:col-start-1 lg:row-start-1 lg:mr-0 lg:grid lg:gap-0 lg:pt-3",
                "lg:transition-[grid-template-columns] lg:duration-700 lg:ease-out motion-reduce:lg:transition-none"
              )}
              style={{
                gridTemplateColumns: cardsVisible
                  ? "0fr 4fr 8fr" // left-aligned once cards appear
                  : "3fr 6fr 3fr", // centered at ~677px on desktop
              }}
            >
              <div />
              <div className="relative lg:pointer-events-auto lg:bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.57)_35%,#000_100%)]">
                {/* Desktop only: shadow glow behind the prompt to fade text above */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden rounded-full lg:block"
                  style={{ boxShadow: "0 0 90px 60px rgba(0,0,0,1)" }}
                />
                <div className="relative">
                  <SearchPromptClient
                    autocompleteService={apiAutocompleteService}
                    key={promptKeyRef.current}
                    onSubmit={handleUserSearch}
                    placeholder={placeholder}
                    searchPreferences={searchPreferencesProps}
                    variant={promptVariant}
                  />
                </div>
              </div>
              <div />
            </div>
          </PageGrid>
        </div>
      }
      thread={
        <>
          {header}
          <div
            className={cn(
              "scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none",
              "lg:snap-y lg:snap-proximity motion-reduce:lg:snap-none"
            )}
            ref={scrollRef}
          >
            {isLoading || autoSubmitStatus !== "done" ? (
              <TurnSkeleton />
            ) : (
              <>
                {completedTurns.map((turn, i) => (
                  <CompletedTurnRow
                    followUps={followUpsByParent.get(turn.id)}
                    intentEyebrowOverride={buildRefinementEyebrow(turn)}
                    key={turn.id}
                    readOnly={readOnly}
                    renderItem={readOnlyRenderItem}
                    submitTurn={submitTurn}
                    suppressContent={isScrolling && i === completedTurns.length - 1}
                    turn={turn}
                  />
                ))}
                {activeSlotTurn && (
                  <ActiveTurnRow
                    animateFromCentered={animateFromCentered}
                    animateText={animateText}
                    domRef={lastTurnRef}
                    followUps={followUpsByParent.get(activeSlotTurn.id)}
                    intentEyebrowOverride={buildRefinementEyebrow(activeSlotTurn)}
                    key={activeSlotTurn.id}
                    pendingTurn={lastCompleteRowTurn ? overlayPendingTurn : undefined}
                    readOnly={readOnly}
                    renderItem={readOnlyRenderItem}
                    scrollContainerRef={scrollRef}
                    submitTurn={submitTurn}
                    suppressLoading={false}
                    turn={activeSlotTurn}
                  />
                )}
              </>
            )}
          </div>
        </>
      }
    />
  );
}

// ─── Ephemeral Orchestrator (no IDB) ──────────────────────────────────────────

/**
 * Mounts only the in-memory ephemeral hook — no IDB collection, no live query,
 * no auto-submit gate. State is discarded on unmount.
 */
function EphemeralOrchestrator(
  props: Omit<SearchResultsOrchestratorProps, "ephemeral" | "searchId">
) {
  const { turns, isLoading, isStreaming, submitTurn, markTurnAnimated } =
    useEphemeralAgentSearchTurns();

  return (
    <OrchestratorContent
      animateFromCentered={props.animateFromCentered}
      animateText={props.animateText}
      autoSubmitStatus="done"
      header={props.header}
      hidePreferences={props.hidePreferences}
      initialQuery={props.initialQuery}
      isEphemeral
      isLoading={isLoading}
      isStreaming={isStreaming}
      markTurnAnimated={markTurnAnimated}
      onEmpty={props.onEmpty}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      submitTurn={submitTurn}
      turns={turns}
    />
  );
}

// ─── Persisted Orchestrator (IDB-backed) ──────────────────────────────────────

/**
 * Mounts IDB-backed hooks: useAgentSearchTurns + useAutoSubmitTurnHandler.
 * Used for the full search page where turn persistence is required.
 */
function PersistedOrchestrator(
  props: Omit<SearchResultsOrchestratorProps, "ephemeral"> & { searchId?: string }
) {
  const routeParams = useParams<{ id: string }>();
  const router = useRouter();
  const { location } = useSearchLocation();

  const routeSearchId = props.searchId ?? routeParams.id;
  const handleSearchNotFound = () => {
    if (props.onEmpty) {
      props.onEmpty();
      return;
    }
    router.replace("/");
  };

  // ── Auto-submit gate — resolves before rendering the thread ────────────
  // NOTE: When initialQuery is provided, we pass "skip-auto-submit" to bypass
  // the handler and use a separate submitTurnRef timeout instead.
  const autoSubmitStatus = useAutoSubmitTurnHandler({
    searchId: props.initialQuery ? "skip-auto-submit" : routeSearchId,
    location,
    onSearchNotFound: handleSearchNotFound,
  });

  // ── Main turn subscription (only meaningful once gate is done) ─────────
  const { turns, isLoading, isStreaming, submitTurn, markTurnAnimated } = useAgentSearchTurns(
    routeSearchId,
    {
      onSearchNotFound: handleSearchNotFound,
    }
  );

  return (
    <OrchestratorContent
      animateFromCentered={props.animateFromCentered}
      animateText={props.animateText}
      autoSubmitStatus={autoSubmitStatus}
      header={props.header}
      hidePreferences={props.hidePreferences}
      initialQuery={props.initialQuery}
      isEphemeral={false}
      isLoading={isLoading}
      isStreaming={isStreaming}
      markTurnAnimated={markTurnAnimated}
      onEmpty={props.onEmpty}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      searchId={routeSearchId}
      submitTurn={submitTurn}
      turns={turns}
    />
  );
}

// ─── Provided Orchestrator (external turn source) ─────────────────────────────

/**
 * Uses an externally-provided turn data source (e.g. BFF-backed hook)
 * instead of the built-in SSE or IDB hooks. The calling feature owns
 * the data lifecycle — this wrapper only connects it to OrchestratorContent.
 */
function ProvidedOrchestrator(
  props: Omit<SearchResultsOrchestratorProps, "ephemeral" | "searchId" | "turnProvider"> & {
    turnProvider: TurnProvider;
  }
) {
  return (
    <OrchestratorContent
      animateFromCentered={props.animateFromCentered}
      animateText={props.animateText}
      autoSubmitStatus="done"
      header={props.header}
      hidePreferences={props.hidePreferences}
      initialQuery={props.initialQuery}
      isEphemeral
      isLoading={props.turnProvider.isLoading}
      isStreaming={props.turnProvider.isStreaming}
      markTurnAnimated={props.turnProvider.markTurnAnimated}
      onEmpty={props.onEmpty}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      submitTurn={props.turnProvider.submitTurn}
      turns={props.turnProvider.turns}
    />
  );
}

// ─── Public Orchestrator (switcher) ───────────────────────────────────────────

/**
 * SearchResultsOrchestrator — scroll container + pinned prompt.
 *
 * Renders one of three variants:
 * - **Provided**: external turn data source (VDP FAQ overlay, BFF-backed)
 * - **Ephemeral**: in-memory turns via SSE (VDP "Something else" overlay)
 * - **Persisted**: IDB-backed turns via SSE (full search page)
 */
export function SearchResultsOrchestrator({
  ephemeral,
  turnProvider,
  ...rest
}: SearchResultsOrchestratorProps) {
  if (turnProvider) {
    return <ProvidedOrchestrator turnProvider={turnProvider} {...rest} />;
  }
  if (ephemeral) {
    return <EphemeralOrchestrator {...rest} />;
  }
  return <PersistedOrchestrator {...rest} />;
}
