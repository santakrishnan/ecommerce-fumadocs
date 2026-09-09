"use client";

import { AnimatePresence, motion } from "motion/react";
import type { SharedHeroPhase, SharedHeroSnapshot } from "./config";
import { useHeroTransitionContext } from "./utils";

interface HeroTransitionOverlayProps {
  onExpandComplete: () => void;
  onRevealComplete: () => void;
  phase: SharedHeroPhase;
  snapshot: SharedHeroSnapshot | null;
}

/**
 * Renders the animated overlay that grows from a card's rect to fill the viewport.
 * Forward-only: expand from card → full-screen, then fade out to reveal VDP.
 */
export function HeroTransitionOverlay({
  snapshot,
  phase,
  onExpandComplete,
  onRevealComplete,
}: HeroTransitionOverlayProps) {
  const config = useHeroTransitionContext();

  if (!snapshot) {
    return <AnimatePresence onExitComplete={onRevealComplete}>{null}</AnimatePresence>;
  }

  const MOUNTED_PHASES = ["expanding", "navigating", "view-transitioning", "revealing"];
  const isMounted = MOUNTED_PHASES.includes(phase);
  const { rect, viewport, alt, href } = snapshot;

  const cardKeyframe = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius: config.collapsedBorderRadiusPx,
  };
  const viewportKeyframe = {
    top: 0,
    left: 0,
    width: viewport.width,
    height: viewport.height,
    borderRadius: 0,
  };

  const isRevealing = phase === "revealing";
  const animateValue = isRevealing ? { opacity: 0 } : viewportKeyframe;
  const initialValue = isRevealing
    ? { ...viewportKeyframe, opacity: 1 }
    : { ...cardKeyframe, opacity: 1 };

  function handleAnimationComplete() {
    if (phase === "expanding") {
      onExpandComplete();
    }
    if (phase === "revealing") {
      onRevealComplete();
    }
  }

  return (
    <AnimatePresence onExitComplete={onRevealComplete}>
      {isMounted && (
        <motion.div
          animate={animateValue}
          aria-hidden="true"
          className="pointer-events-none fixed z-[1000] overflow-hidden"
          initial={initialValue}
          key={`${href}:${rect.top}:${rect.left}`}
          onAnimationComplete={handleAnimationComplete}
          style={{
            willChange: "top, left, width, height, opacity, border-radius",
            viewTransitionName: config.overlayViewTransitionName,
          }}
          transition={{
            duration: isRevealing ? config.revealDurationSec : config.expandDurationSec,
            ease: isRevealing ? config.revealEase : config.expandEase,
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: transient overlay; uses already-cached card image */}
          <img
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover object-[17%_center] lg:object-center"
            decoding="sync"
            fetchPriority="high"
            height={viewport.height}
            loading="eager"
            src={snapshot.imageSrc || config.heroImageSrc}
            width={viewport.width}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
