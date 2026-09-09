"use client";

import { InputGroupButton, Popover } from "@ucmp/ui";
import { IconSearchContext } from "@ucmp/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchPreferencesContent } from "./search-preferences-content";

export interface SearchPreferencesPopoverProps {
  explanationText?: string;
  /** Whether unsaved preference changes exist (controls Save button enabled state). */
  hasUnsavedChanges?: boolean;
  /**
   * Called when the panel closes without saving. Reverts any dismissed
   * preferences back to their original state.
   */
  onClose?: () => void;
  /**
   * When provided, the parent owns the preference list (controlled mode).
   * Each removal calls onDismissPreference instead of updating local state.
   */
  onDismissPreference?: (preferenceToRemove: string) => void;
  /**
   * Called when the user clicks "Save changes". Commits dismissed preferences
   * and triggers a refinement turn.
   */
  onSave?: () => void;
  preferences?: string[];
}

/**
 * Search preferences panel — renders inline above the search input form.
 *
 * Uses absolute positioning within the form's relative container so the panel
 * naturally aligns left/right with the input (same grid cell, same width).
 * The panel sits at `bottom: 100%` of the form — directly above it with no gap.
 */
export function SearchPreferencesPopover({
  explanationText = "",
  hasUnsavedChanges = false,
  onDismissPreference,
  onClose,
  onSave,
  preferences = [],
}: SearchPreferencesPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isControlled = onDismissPreference !== undefined;
  const displayPreferences = isControlled ? preferences : localPreferences;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
      onClose?.();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        onClose?.();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDismissPreference = (preferenceToRemove: string) => {
    if (isControlled) {
      onDismissPreference(preferenceToRemove);
    } else {
      setLocalPreferences((prev) => prev.filter((p) => p !== preferenceToRemove));
    }
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSave = () => {
    setIsOpen(false);
    onSave?.();
  };

  // Find the form's relative positioned ancestor to portal the panel into
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!triggerRef.current) {
      return;
    }
    const form = triggerRef.current.closest("form");
    const relativeParent = form?.closest("[class*='relative']") as HTMLElement | null;
    if (relativeParent) {
      setPortalTarget(relativeParent);
    }
  }, []);

  return (
    <>
      <InputGroupButton
        aria-expanded={isOpen}
        aria-label="View search context"
        onClick={handleToggle}
        ref={triggerRef}
        size="icon-sm"
      >
        <IconSearchContext className="size-5" />
      </InputGroupButton>

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <Popover open>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-0 bottom-0 z-50"
                  data-has-search-preferences="true"
                  data-slot="popover-content"
                  exit={{ opacity: 0, y: 20 }}
                  initial={{ opacity: 0, y: 20 }}
                  key="preferences-panel"
                  ref={panelRef}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="flex w-full flex-col gap-6 rounded-3xl bg-surface-secondary px-6 pt-8 pb-4 shadow-lg lg:p-6">
                    <SearchPreferencesContent
                      explanationText={explanationText}
                      hasUnsavedChanges={hasUnsavedChanges}
                      onClose={handleClose}
                      onDismissPreference={handleDismissPreference}
                      onSave={handleSave}
                      preferences={displayPreferences}
                    />
                  </div>
                  <span
                    className="sr-only"
                    data-has-search-preferences="true"
                    data-testid="search-preferences-meta"
                  >
                    {displayPreferences.length}
                  </span>
                </motion.div>
              </Popover>
            )}
          </AnimatePresence>,
          portalTarget
        )}
    </>
  );
}
