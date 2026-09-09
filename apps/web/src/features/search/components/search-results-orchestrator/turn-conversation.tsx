"use client";

import type { ReactNode, RefObject } from "react";
import { cn } from "utils";
import { AGENT_SEARCH_ERROR_MESSAGE } from "../../data/agent-error-copy";
import type { SubmitTurnOptions } from "../../hooks/use-agent-search-turns";
import { useSearchLocation } from "../../hooks/use-search-location";
import type { AgentSearchTurn, ResponseAction } from "../../lib/agent-search-turns-collection";
import { createResultCardRenderer } from "../../lib/render-result-card";
import { isAllPills } from "../../lib/response-cards";
import type { AgentSearchLocation } from "../../services/agent-search-service";
import { IntentBanner, type IntentBannerAction } from "../intent-banner";
import { MarkdownRenderer } from "../markdown-renderer";
import { AnimatedResponseText } from "./animated-response-text";
import { getTurnBeats, turnToResultItems } from "./turn-mappers";

/** Static loader header — matches the landing transition screen's copy. */
const WORKING_ON_IT = "Working on it...";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TurnConversationProps {
  /**
   * When true, renders the active-turn behaviour: a loading state while the
   * turn is pending/streaming. Response text renders statically once complete.
   */
  active?: boolean;
  /** When true, the response text reveals word by word (VDP overlay). */
  animateText?: boolean;
  /**
   * Settled follow-up turns for this row. Each renders as a stacked banner
   * (request eyebrow + response) below the main turn, with any pill cards inline
   * beneath its response. Ordered oldest → newest.
   */
  followUps?: AgentSearchTurn[];
  /** Eyebrow override (e.g. preference-refinement notification). */
  intentEyebrowOverride?: string | { text: string; icon?: ReactNode };
  isAwaitingResults?: boolean;
  /** Ref forwarded to the pending item's wrapper for scroll-into-view. */
  pendingItemRef?: RefObject<HTMLDivElement | null>;
  /** A pending turn submitted after this one — renders as a stacked loading banner. */
  pendingTurn?: AgentSearchTurn;
  /** When true, cards render non-interactively and action hrefs become turn submits. */
  readOnly?: boolean;
  submitTurn: (options: SubmitTurnOptions) => void;
  suppressLoading?: boolean;
  turn: AgentSearchTurn;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildResponseNode(responseText: string | undefined, animateText?: boolean): ReactNode {
  if (!responseText) {
    return;
  }
  if (animateText) {
    return <AnimatedResponseText text={responseText} />;
  }
  return <MarkdownRenderer content={responseText} />;
}

function buildErrorResponse(): ReactNode {
  return <p className="body-xl text-text-tertiary">{AGENT_SEARCH_ERROR_MESSAGE}</p>;
}

function buildRetryAction(
  query: string | undefined,
  submitTurn: (options: SubmitTurnOptions) => void,
  location: AgentSearchLocation
): IntentBannerAction[] | undefined {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return;
  }
  return [
    {
      label: "Try again",
      onClick: () => submitTurn({ query: trimmedQuery, location, source: "query" }),
    },
  ];
}

/**
 * In readOnly mode, remap action hrefs to onClick handlers that submit the
 * action label as the next conversational turn. Otherwise pass through.
 */
function buildResponseActions(
  rawActions: ResponseAction[] | undefined,
  readOnly: boolean | undefined,
  submitTurn: (options: SubmitTurnOptions) => void,
  location: AgentSearchLocation
): IntentBannerAction[] | undefined {
  if (!(readOnly && rawActions)) {
    return rawActions;
  }
  return rawActions.map((action) => ({
    label: action.label,
    onClick: () => submitTurn({ query: action.label, location, source: "query" }),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TurnConversation({
  turn,
  active = false,
  animateText,
  suppressLoading = false,
  pendingTurn,
  pendingItemRef,
  followUps,
  submitTurn,
  intentEyebrowOverride,
  readOnly,
}: TurnConversationProps) {
  const isComplete = turn.status === "complete";
  const isError = turn.status === "error";
  const responseText = isComplete ? turn.response?.summary : undefined;
  const { location } = useSearchLocation();
  const responseActions = isError
    ? buildRetryAction(turn.query, submitTurn, location)
    : buildResponseActions(
        isComplete ? turn.response?.actions : undefined,
        readOnly,
        submitTurn,
        location
      );

  const isActive = active && (turn.status === "pending" || turn.status === "streaming");
  const showLoadingState = isActive && !suppressLoading;

  const eyebrow = intentEyebrowOverride ?? turn.query ?? turn.label;
  const responseNode = buildResponseNode(responseText, animateText);

  const pendingEyebrow = pendingTurn ? (pendingTurn.query ?? pendingTurn.label) : undefined;

  return (
    <>
      {/* ── Main turn ────────────────────────────────────────────────────── */}
      <IntentBanner
        actions={responseActions}
        beats={getTurnBeats(turn)}
        intentEyebrow={eyebrow}
        isLoading={showLoadingState}
        response={isError ? buildErrorResponse() : responseNode}
        statusText={showLoadingState ? WORKING_ON_IT : undefined}
      />

      {/* Exploration anchor: its pills render inline in the thread, since the
          card column sources the row's canonical (non-pill) cards. */}
      {!readOnly && isAllPills(turn.response) && (
        <div className={cn("mt-6 flex animate-slide-up-delayed flex-row flex-wrap gap-2")}>
          {(() => {
            const renderCard = createResultCardRenderer(submitTurn);
            return turnToResultItems(turn).map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ));
          })()}
        </div>
      )}

      {/* ── Settled follow-ups: appended request/response (+ inline pills) ── */}
      {followUps?.map((followUp) => (
        <FollowUpBanner
          followUp={followUp}
          key={followUp.id}
          readOnly={readOnly}
          submitTurn={submitTurn}
        />
      ))}

      {/* ── Pending turn (desktop: scrolls into view; mobile: stacks) ─────── */}
      {pendingTurn && (
        <div
          className="col-span-4 pt-[calc(var(--search-nav-height,7.5rem)+2rem)] md:col-span-6 lg:min-h-[calc(100dvh-var(--search-nav-height,7.5rem)-1.5rem)] lg:pt-[calc(var(--search-nav-height,7.5rem)+1.5rem)]"
          ref={pendingItemRef}
        >
          <IntentBanner
            beats={pendingTurn ? getTurnBeats(pendingTurn) : undefined}
            intentEyebrow={pendingEyebrow}
            isLoading
            statusText={WORKING_ON_IT}
          />
        </div>
      )}
    </>
  );
}

/**
 * A single settled follow-up rendered in the row's conversation thread: the
 * request eyebrow + response text, with any pill cards inline beneath it.
 *
 * A follow-up that drilled into an existing card renders text only — that card
 * is surfaced by focusing it in the row's card panel, not re-rendered here — so
 * only exploration (pills-only) follow-ups render inline cards.
 */
function FollowUpBanner({
  followUp,
  submitTurn,
  readOnly,
}: {
  followUp: AgentSearchTurn;
  readOnly?: boolean;
  submitTurn: (options: SubmitTurnOptions) => void;
}) {
  const eyebrow = followUp.query ?? followUp.label;
  const summary = followUp.status === "complete" ? followUp.response?.summary : undefined;
  const response: ReactNode = summary ? <MarkdownRenderer content={summary} /> : undefined;

  const showInlinePills = !readOnly && isAllPills(followUp.response);

  // Mirror the pending overlay's sizing (top padding that clears the nav + a
  // near-viewport min-height on desktop) so a follow-up keeps its position when
  // it settles: the request/response stays aligned to the top of the anchor's
  // cards, tall enough to scroll to that spot — no jump from loading to settled.
  return (
    <div
      className="col-span-4 pt-[calc(var(--search-nav-height,7.5rem)+2rem)] md:col-span-6 lg:min-h-[calc(100dvh-var(--search-nav-height,7.5rem)-1.5rem)] lg:pt-[calc(var(--search-nav-height,7.5rem)+1.5rem)]"
      data-turn-response
    >
      <div className="flex flex-col gap-6">
        <IntentBanner intentEyebrow={eyebrow} response={response} />
        {showInlinePills && (
          <div className={cn("flex animate-slide-up-delayed flex-row flex-wrap gap-2")}>
            {turnToResultItems(followUp).map((item) => (
              <div key={item.id}>{createResultCardRenderer(submitTurn)(item)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
