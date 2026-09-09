"use client";

import { PageGrid } from "@ucmp/ui";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import type { SubmitTurnOptions } from "../../hooks/use-agent-search-turns";
import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import { getCanonicalCardTurn } from "../../lib/response-cards";
import type { SearchResultItem } from "../../types/search-results";
import { CAROUSEL_BLEED_RIGHT } from "./constants";
import { TurnCards } from "./turn-cards";
import { TurnConversation } from "./turn-conversation";
import { getSeeAllHref, turnToResultItems } from "./turn-mappers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveTurnRowProps {
  /**
   * When true (the first active turn of the session — page load or first
   * search), play the full reveal: text centered, then cards slide in from the
   * right as the layout condenses. When false (a turn-to-turn transition like a
   * card click), start already in the two-column layout and just slide up.
   */
  animateFromCentered?: boolean;
  /** When true, the response text reveals word by word instead of at once (VDP overlay). */
  animateText?: boolean;
  domRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Settled follow-up turns attached to this row. Their request/response text is
   * appended below this turn's conversation; the card the latest follow-up
   * drilled into is focused. The row's cards stay its canonical cards.
   */
  followUps?: AgentSearchTurn[];
  /** Eyebrow override (e.g. preference-refinement notification). */
  intentEyebrowOverride?: string | { text: string; icon?: ReactNode };
  /** A pending turn submitted after this one — its intent replaces the eyebrow. */
  pendingTurn?: AgentSearchTurn;
  /** When true, cards render without interactivity and "See all results" is hidden. */
  readOnly?: boolean;
  /** Optional override renderer for result cards (e.g. the read-only renderer). */
  renderItem?: (item: SearchResultItem) => ReactNode;
  /**
   * The outer scrollable container ref (from the orchestrator). Used to scroll
   * pending intents and focused cards into view.
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  submitTurn: (options: SubmitTurnOptions) => void;
  suppressLoading?: boolean;
  turn: AgentSearchTurn;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * The most-recent turn. On the first active turn of the session it plays the
 * full reveal (centered text → cards slide in from the right as the layout
 * condenses). For later turn-to-turn transitions it starts already in the
 * two-column layout and the new text + cards simply slide up.
 */
export function ActiveTurnRow({
  turn,
  domRef,
  suppressLoading,
  submitTurn,
  pendingTurn,
  followUps,
  scrollContainerRef,
  animateFromCentered = false,
  animateText,
  intentEyebrowOverride,
  readOnly,
  renderItem,
}: ActiveTurnRowProps) {
  // Capture the reveal decision once at mount. The row is keyed by turn id, so
  // this stays stable for the turn's lifetime even if the orchestrator flips
  // the prop to false after persisting `animationPlayed` mid-reveal.
  const [playFullReveal] = useState(animateFromCentered);
  // Cards come from the row's canonical-card turn — the first turn in the chain
  // (anchor + follow-ups) to carry non-pill cards, which may be a follow-up
  // rather than this anchor. Empty while the row is still exploring.
  const cardTurn = getCanonicalCardTurn([turn, ...(followUps ?? [])]);
  const results = cardTurn ? turnToResultItems(cardTurn) : [];
  const seeAllHref = readOnly || !cardTurn ? undefined : getSeeAllHref(cardTurn, results);

  // The canonical card a matching follow-up drilled into — focus it once so it
  // gets a native focus ring and is ready for interaction. Latest follow-up
  // only; -1 when the latest follow-up matched nothing (exploration).
  const focusCardId = followUps?.at(-1)?.matchedCardIds?.[0];
  const focusCardIndex = focusCardId ? results.findIndex((item) => item.id === focusCardId) : -1;

  // Full path only (animateFromCentered): cards start hidden so the text renders
  // centered first, then reveal after a delay covering the text slide-up. Every
  // non-full path (fade-in fallback, including back-navigation) starts with the
  // layout already two-column, so cards are "visible" from the start and appear
  // as soon as results arrive.
  const [cardsVisible, setCardsVisible] = useState(!playFullReveal);
  useEffect(() => {
    if (!playFullReveal || results.length === 0) {
      return;
    }
    // Delay matches the text slide-up animation (~900ms + 150ms delay).
    const timer = setTimeout(() => setCardsVisible(true), 1050);
    return () => clearTimeout(timer);
  }, [playFullReveal, results.length]);

  const showCards = results.length > 0 && cardsVisible;

  // Only the first turn of the session (playFullReveal) ever centers: it
  // stays centered while card-less and reveals into two columns once its cards
  // arrive. Every later row stays in the left layout and never re-centers.
  // A pill-only response stays centered — pills render inline in the text
  // column, so there's nothing in the right panel to justify two-column mode.
  const twoColumn = !playFullReveal || showCards;

  // Resolve the grid-template-columns class once from both axes:
  // twoColumn (cards visible) always collapses to 0fr_4fr_8fr regardless of alignment.
  // Exploration (no cards yet): left pins text left, center distributes gutters evenly.
  let gridColsClass = "lg:[grid-template-columns:2fr_8fr_2fr]";
  if (twoColumn) {
    gridColsClass = "lg:[grid-template-columns:0fr_4fr_8fr]";
  }

  // When a pending turn appears, scroll the outer container to the bottom so the
  // new intent lands in view. The turn grows to fit its content, so the whole
  // thread scrolls as one. On mobile, size the pending item so scrolling lands
  // the intent just below the nav.
  const pendingItemRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!pendingTurn) {
      return;
    }
    const outerContainer = scrollContainerRef?.current;
    if (!outerContainer) {
      return;
    }
    if (window.innerWidth < 1024) {
      const pendingEl = pendingItemRef.current;
      if (pendingEl) {
        const navHeightRem = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--search-nav-height") ||
            "7.5"
        );
        const navHeightPx =
          navHeightRem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        pendingEl.style.minHeight = `${outerContainer.clientHeight - navHeightPx}px`;
      }
    }
    outerContainer.scrollTo({
      top: outerContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [pendingTurn, scrollContainerRef]);

  // Focus the card a matching follow-up drilled into: it gets a native focus
  // ring and is ready for immediate interaction. Each card renders exactly one
  // [data-carousel-focus] target, in results order; we scope to the visible
  // panel. Focusing scrolls the card into view — which on mobile pushes the
  // response text off the top — so afterwards we pin the row's latest response
  // header back to the top of the thread.
  //
  // The outer-container scroll is deferred on full-reveal turns by the same
  // 700ms as the grid-template-columns transition (lg:duration-700) so
  // positions are stable when we measure. focus() fires immediately regardless.
  useEffect(() => {
    if (focusCardIndex < 0 || !showCards) {
      return;
    }
    const row = domRef?.current;
    if (!row) {
      return;
    }
    const target = [...row.querySelectorAll<HTMLElement>("[data-carousel-focus]")].filter(
      (element) => element.offsetParent !== null
    )[focusCardIndex];
    if (!target) {
      return;
    }
    // Focus immediately — independent of the layout transition.
    target.focus();

    const outerContainer = scrollContainerRef?.current;
    if (!outerContainer) {
      return;
    }
    const doScroll = () => {
      const responses = [...row.querySelectorAll<HTMLElement>("[data-turn-response]")];
      const lastResponse = responses.at(-1);
      if (lastResponse) {
        const delta =
          lastResponse.getBoundingClientRect().top - outerContainer.getBoundingClientRect().top;
        outerContainer.scrollTo({
          top: outerContainer.scrollTop + delta + 24, // 1.5rem gap between last response and cards
          behavior: "smooth",
        });
      } else {
        outerContainer.scrollTo({
          top: row.offsetTop,
          behavior: "smooth",
        });
      }
    };

    // Non-full-reveal turns start already in two-column layout — no transition
    // is running, so scroll immediately.
    if (!playFullReveal) {
      doScroll();
      return;
    }
    // Full-reveal: wait for the grid-template-columns transition (duration-700)
    // to complete before measuring positions.
    const timer = setTimeout(doScroll, 700);
    return () => clearTimeout(timer);
  }, [focusCardIndex, showCards, playFullReveal, domRef, scrollContainerRef]);

  // When cards first appear on a full-reveal turn and no follow-up matched a
  // specific card (focusCardIndex < 0), correct the scroll position after the
  // grid-template-columns transition (duration-700) so the last response stays
  // at the top of the text column. The focusCardIndex effect handles this when
  // a matched card is present; this effect covers the no-matched-card path.
  useEffect(() => {
    if (!playFullReveal || focusCardIndex >= 0 || !showCards) {
      return;
    }
    const outerContainer = scrollContainerRef?.current;
    if (!outerContainer) {
      return;
    }
    const row = domRef?.current;
    if (!row) {
      return;
    }
    const timer = setTimeout(() => {
      const responses = [...row.querySelectorAll<HTMLElement>("[data-turn-response]")];
      const lastResponse = responses.at(-1);
      if (lastResponse) {
        const delta =
          lastResponse.getBoundingClientRect().top - outerContainer.getBoundingClientRect().top;
        outerContainer.scrollTo({
          top: outerContainer.scrollTop + delta + 24, // 1.5rem gap between last response and cards
          behavior: "smooth",
        });
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [playFullReveal, showCards, focusCardIndex, domRef, scrollContainerRef]);

  return (
    <PageGrid className={cn("h-full lg:h-auto lg:min-h-full lg:snap-start")} ref={domRef}>
      {/* Left: text + mobile cards. Spans full width and hosts a nested grid
          whose column template is animatable (grid-column is not), so the text
          track eases from centered 8fr → left 4fr as the cards slide in. */}
      <div
        className={cn(
          "col-span-4 -mr-5 flex flex-col md:col-span-8 lg:col-span-12 lg:col-start-1 lg:row-start-1 lg:mr-0 lg:grid lg:min-h-dvh lg:gap-0",
          playFullReveal &&
            "lg:transition-[grid-template-columns] lg:duration-700 lg:ease-out motion-reduce:lg:transition-none",
          gridColsClass
        )}
      >
        <div className="scrollbar-none grid grid-cols-4 pt-(--search-nav-height,7.5rem) pr-5 pb-32 md:grid-cols-8 lg:col-start-2 lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pt-[calc(var(--search-nav-height,7.5rem))] lg:pr-0 lg:pb-40">
          <div className="col-span-4 md:col-span-6">
            <TurnConversation
              active
              animateText={animateText}
              followUps={followUps}
              intentEyebrowOverride={intentEyebrowOverride}
              pendingItemRef={pendingItemRef}
              pendingTurn={pendingTurn}
              readOnly={readOnly}
              submitTurn={submitTurn}
              suppressLoading={suppressLoading}
              turn={turn}
            />
          </div>

          {/* Mobile/Tablet: cards inline below text. Not gated behind the reveal
              delay — they slide up with the text as the new row comes in. */}
          {results.length > 0 && (
            <div
              className={cn(
                "col-span-4 mt-6 animate-slide-up-delayed md:col-span-8 lg:hidden",
                pendingTurn && "hidden"
              )}
            >
              <TurnCards
                panelClassName="-mr-5"
                renderItem={renderItem}
                results={results}
                seeAllHref={seeAllHref}
                seeAllWrapperClassName="mt-8 flex justify-start"
                submitTurn={submitTurn}
                turn={cardTurn ?? turn}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: cards desktop only. First active turn: slide in from the right
          as the layout condenses. Turn-to-turn: the layout is already
          two-column, so the cards just slide up with the new text. */}
      {results.length > 0 && showCards && (
        <div
          className={cn(
            "hidden lg:sticky lg:top-0 lg:row-start-1 lg:flex lg:h-dvh lg:flex-col lg:pt-(--search-nav-height,7.5rem) lg:pb-10",
            playFullReveal ? "animate-slide-in-left-delayed" : "animate-slide-up-delayed",
            results.length === 6 ? "lg:col-span-7 lg:col-start-6" : "lg:col-span-8 lg:col-start-6"
          )}
        >
          <div className="flex flex-1 flex-col">
            <TurnCards
              panelClassName={CAROUSEL_BLEED_RIGHT}
              renderItem={renderItem}
              results={results}
              seeAllHref={seeAllHref}
              seeAllWrapperClassName="mt-auto flex w-full items-center justify-end pt-4"
              submitTurn={submitTurn}
              turn={cardTurn ?? turn}
            />
          </div>
        </div>
      )}
    </PageGrid>
  );
}
