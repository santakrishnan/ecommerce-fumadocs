"use client";

import { SearchResultsOrchestratorWrapper } from "@features/search";
import { useVdpFaqTurns } from "@features/vehicle-detail/hooks/use-vdp-faq";
import vdpOverlayBlurred from "@public/images/backgrounds/vdp-overlay-image-blurred.png";
import { AskQuestionPrompt } from "@shared/components/ask-question-prompt";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { formatVehicleHeading } from "../../lib/format-vehicle-heading";
import { ExpandOverlay, useExpandOverlay } from "../expand-overlay";
import { OverlayHeader } from "../expand-overlay/overlay-header";

export interface AskQuestionCardProps {
  /** Additional CSS classes */
  className?: string;
  /** FAQ section heading (e.g. "Frequently Asked Questions - Highlander") */
  heading: string;
  /** Vehicle model (e.g. "Highlander") */
  model: string;
  /** Pre-built suggested questions */
  suggestions: string[];
  /** Vehicle trim (e.g. "Hybrid Limited") */
  trim: string;
  /** VIN for context */
  vin: string;
  /** Vehicle year */
  year: number | string;
}

/**
 * AskQuestionCard — conversational prompt card for VDP.
 *
 * Wraps the shared AskQuestionPrompt with the full-viewport conversational
 * overlay. Clicking a pill expands the card into the overlay powered by the
 * search orchestrator. Close button (or Escape key) reverses the animation.
 *
 * @see Figma node 4331:100340
 */
export function AskQuestionCard({
  heading,
  model,
  trim,
  year,
  vin,
  suggestions,
  className,
}: AskQuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [searchId, setSearchId] = useState(() => crypto.randomUUID());

  const overlay = useExpandOverlay(cardRef);

  function handleSelect(question: string | null) {
    setSelectedQuestion(question);
    setSearchId(crypto.randomUUID());
    overlay.open();
  }

  return (
    <>
      <div ref={cardRef}>
        <motion.div
          animate={{ opacity: overlay.isMounted ? 0 : 1 }}
          aria-hidden={overlay.isMounted}
          inert={overlay.isMounted ? true : undefined}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <AskQuestionPrompt
            catchAllLabel="Something else"
            className={className}
            heading={heading}
            headingLevel="h2"
            onSelect={handleSelect}
            questions={suggestions}
            variant="dark"
          />
        </motion.div>
      </div>

      {overlay.isMounted && (
        <ExpandOverlay
          ariaLabel="Vehicle question overlay"
          background={
            <>
              <Image
                alt=""
                className="pointer-events-none scale-125 object-cover blur-[50px]"
                fill
                priority
                sizes="100vw"
                src={vdpOverlayBlurred}
              />
              <div className="pointer-events-none absolute inset-0 bg-overlay" />
            </>
          }
          contentVisible={overlay.contentVisible}
          onCollapseEnd={overlay.onCollapseEnd}
          onRequestClose={overlay.close}
          phase={overlay.phase}
          sourceRect={overlay.sourceRect}
        >
          <ConversationalOverlayContent
            contentVisible={overlay.contentVisible}
            initialQuery={selectedQuestion}
            model={model}
            onClose={overlay.close}
            searchId={searchId}
            trim={trim}
            vin={vin}
            year={year}
          />
        </ExpandOverlay>
      )}
    </>
  );
}

// ─── Overlay content (background + search orchestrator) ─────────────────────

interface ConversationalOverlayContentProps {
  contentVisible: boolean;
  initialQuery: string | null;
  model: string;
  onClose: () => void;
  searchId: string;
  trim: string;
  vin: string;
  year: number | string;
}

function ConversationalOverlayContent({
  contentVisible,
  initialQuery,
  model,
  onClose,
  searchId,
  trim,
  vin,
  year,
}: ConversationalOverlayContentProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const vdpFaqTurns = useVdpFaqTurns(vin);

  // Focus the close button once content becomes visible
  useEffect(() => {
    if (!contentVisible) {
      return;
    }
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [contentVisible]);

  return (
    <div className="relative h-full w-full [--search-nav-height:var(--nav-height)]">
      <SearchResultsOrchestratorWrapper
        animateFromCentered={false}
        animateText
        ephemeral={!initialQuery}
        header={
          <OverlayHeader
            className="absolute top-0 right-0 left-0 z-10"
            closeRef={closeButtonRef}
            onClose={onClose}
            title={formatVehicleHeading(model, trim)}
            year={year}
          />
        }
        hidePreferences
        initialQuery={initialQuery ?? undefined}
        key={searchId}
        onEmpty={onClose}
        placeholder="Ask anything"
        readOnly
        turnProvider={vdpFaqTurns}
      />
    </div>
  );
}
