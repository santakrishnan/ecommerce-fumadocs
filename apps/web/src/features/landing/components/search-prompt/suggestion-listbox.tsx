"use client";

import { cn } from "@ucmp/ui/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { Suggestion } from "../../services/autocomplete-service";
import { SuggestionItem } from "./suggestion-item";

interface SuggestionListboxProps {
  /** Currently highlighted index (-1 = none). */
  activeIndex: number;
  /**
   * Called when the user scrolls the suggestion list by more than 1rem (16px).
   * Parent should blur the textarea to dismiss the keyboard on mobile.
   */
  onScrollDismiss?: () => void;
  /** Called when a suggestion is clicked. */
  onSelect: (suggestion: Suggestion) => void;
  /** List of suggestions to display. */
  suggestions: Suggestion[];
}

/**
 * Accessible suggestion listbox with Motion-managed lifecycle.
 *
 * Enter/exit sequencing and stagger are controlled declaratively via
 * AnimatePresence + Motion variants. Selection tap/dim micro-feedback remains
 * CSS-based to preserve the existing feel.
 */
export function SuggestionListbox({
  activeIndex,
  onScrollDismiss,
  onSelect,
  suggestions,
}: SuggestionListboxProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const scrollStartRef = useRef<number | null>(null);
  const hasDismissedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  if (suggestions.length === 0) {
    return null;
  }

  const handleSelect = (suggestion: Suggestion) => {
    setSelectedValue(suggestion.value);
    // Notify parent immediately (keeps existing contract + tests passing).
    onSelect(suggestion);
    // Reset after the dim animation completes (150ms). The timer is intentionally
    // not cleared on unmount — if the component unmounts mid-animation the no-op
    // setState on an unmounted component is harmless in React 19 and avoids the
    // overhead of tracking a ref for a fire-and-forget 150ms timer.
    setTimeout(() => setSelectedValue(null), 150);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onScrollDismiss || hasDismissedRef.current) {
      return;
    }
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollStartRef.current === null) {
      scrollStartRef.current = scrollTop;
      return;
    }
    if (Math.abs(scrollTop - scrollStartRef.current) >= 16) {
      hasDismissedRef.current = true;
      onScrollDismiss();
    }
  };

  const enterDuration = prefersReducedMotion ? 0 : 0.7;
  const listStagger = prefersReducedMotion ? 0 : 0.05;

  // Exit variants are functions so they can read the `custom` value forwarded
  // by AnimatePresence at exit time. This is necessary because Motion captures
  // exit values from the last render before removal — a plain static object
  // cannot reflect the skip-exit intent that is set synchronously in the event
  // handler just before the state update that unmounts this component.
  const containerVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 56 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: enterDuration,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        when: "beforeChildren" as const,
        staggerChildren: listStagger,
      },
    },
    exit: (skip: boolean) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : -8,
      transition: {
        duration: skip || prefersReducedMotion ? 0 : 0.15,
        ease: "easeIn" as const,
        when: "afterChildren" as const,
        staggerChildren: skip || prefersReducedMotion ? 0 : listStagger,
        staggerDirection: -1 as const,
      },
    }),
  };

  const itemVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 56 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: enterDuration,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      },
    },
    exit: (skip: boolean) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : -8,
      transition: {
        duration: skip || prefersReducedMotion ? 0 : 0.15,
        ease: "easeIn" as const,
      },
    }),
  };

  return (
    <motion.div
      animate="visible"
      aria-label="Search suggestions"
      className={cn(
        "absolute right-0 left-0 z-10",
        "bottom-full mb-10 lg:top-full lg:bottom-auto lg:mt-10"
      )}
      exit="exit"
      id="search-suggestions"
      initial="initial"
      onScroll={handleScroll}
      role="listbox"
      variants={containerVariants}
    >
      <div className="flex flex-col gap-6 pl-8">
        {suggestions.map((suggestion, index) => (
          <motion.div
            animate="visible"
            exit="exit"
            initial="initial"
            key={suggestion.value}
            variants={itemVariants}
          >
            <SuggestionItem
              isActive={index === activeIndex}
              isDimmed={selectedValue !== null && selectedValue !== suggestion.value}
              isSelected={selectedValue === suggestion.value}
              onSelect={() => handleSelect(suggestion)}
              suggestion={suggestion}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
