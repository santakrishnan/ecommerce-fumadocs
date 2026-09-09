"use client";

import { Button, Chip, PopoverHeader, PopoverTitle } from "@ucmp/ui";
import { IconClose, IconToyotaX } from "@ucmp/ui/icons";
import { useLayoutEffect, useRef } from "react";

interface SearchPreferencesContentProps {
  explanationText: string;
  hasUnsavedChanges?: boolean;
  onClose: () => void;
  onDismissPreference: (preferenceToRemove: string) => void;
  onSave: () => void;
  preferences: string[];
}

// ─── Animation Helpers ──────────────────────────────────────

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateElement(element: HTMLElement, deltaX: number, deltaY: number): void {
  if (typeof element.animate === "function") {
    element.animate(
      [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0px, 0px)" }],
      {
        duration: 300,
        easing: "ease-out",
      }
    );
  }
}

function computePositionDelta(
  previousPosition: { left: number; top: number },
  nextPosition: { left: number; top: number }
): { deltaX: number; deltaY: number } {
  return {
    deltaX: previousPosition.left - nextPosition.left,
    deltaY: previousPosition.top - nextPosition.top,
  };
}

function shouldAnimateHeight(previousHeight: number | null, nextHeight: number): boolean {
  return previousHeight !== null && previousHeight !== nextHeight;
}

export function SearchPreferencesContent({
  explanationText,
  hasUnsavedChanges = false,
  preferences,
  onClose,
  onDismissPreference,
  onSave,
}: SearchPreferencesContentProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeButtonRowRef = useRef<HTMLDivElement>(null);
  const dynamicContentRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLLIElement>());
  const previousChipPositions = useRef(new Map<string, { left: number; top: number }>());
  const previousDynamicContentHeight = useRef<number | null>(null);
  const previousFloatingPositions = useRef(new Map<string, { left: number; top: number }>());

  useLayoutEffect(() => {
    const listElement = listRef.current;
    if (!listElement || prefersReducedMotion()) {
      previousChipPositions.current.clear();
      return;
    }

    const listRect = listElement.getBoundingClientRect();
    const currentChipPositions = new Map<string, { left: number; top: number }>();

    for (const preference of preferences) {
      const chipElement = chipRefs.current.get(preference);
      if (!chipElement) {
        continue;
      }

      const nextRect = chipElement.getBoundingClientRect();
      const nextPosition = {
        left: nextRect.left - listRect.left,
        top: nextRect.top - listRect.top,
      };
      currentChipPositions.set(preference, nextPosition);

      const previousPosition = previousChipPositions.current.get(preference);
      if (!previousPosition) {
        continue;
      }

      const { deltaX, deltaY } = computePositionDelta(previousPosition, nextPosition);
      const hasNoMovement = deltaX === 0 && deltaY === 0;

      if (!hasNoMovement) {
        animateElement(chipElement, deltaX, deltaY);
      }
    }

    previousChipPositions.current = currentChipPositions;
  }, [preferences]);

  useLayoutEffect(() => {
    const contentElement = dynamicContentRef.current;
    if (!contentElement || prefersReducedMotion()) {
      return;
    }

    const nextHeight = contentElement.getBoundingClientRect().height;
    const previousHeight = previousDynamicContentHeight.current;

    if (
      shouldAnimateHeight(previousHeight, nextHeight) &&
      typeof contentElement.animate === "function"
    ) {
      contentElement.animate([{ height: `${previousHeight}px` }, { height: `${nextHeight}px` }], {
        duration: 300,
        easing: "ease-out",
      });
    }

    previousDynamicContentHeight.current = nextHeight;
  }, [preferences]);

  useLayoutEffect(() => {
    const floatingElements = [
      { element: headerRef.current, key: "header" },
      { element: closeButtonRowRef.current, key: "close-button-row" },
    ];

    const currentPositions = new Map<string, { left: number; top: number }>();

    for (const { element, key } of floatingElements) {
      if (!element) {
        continue;
      }

      const anchorElement = element.closest("[data-slot='popover-content']") as HTMLElement | null;
      const anchorRect = anchorElement?.getBoundingClientRect();
      const nextRect = element.getBoundingClientRect();
      const nextPosition = {
        left: anchorRect ? nextRect.left - anchorRect.left : nextRect.left,
        top: anchorRect ? nextRect.top - anchorRect.top : nextRect.top,
      };
      currentPositions.set(key, nextPosition);

      const previousPosition = previousFloatingPositions.current.get(key);
      const isFirstMeasure = !previousPosition;
      const shouldSkip = isFirstMeasure || prefersReducedMotion();

      if (shouldSkip || !previousPosition) {
        continue;
      }

      const { deltaX, deltaY } = computePositionDelta(previousPosition, nextPosition);
      const hasNoMovement = deltaX === 0 && deltaY === 0;

      if (!hasNoMovement) {
        animateElement(element, deltaX, deltaY);
      }
    }

    previousFloatingPositions.current = currentPositions;
  }, [preferences]);

  return (
    <>
      <div className="flex w-full flex-col gap-4" ref={headerRef}>
        <PopoverHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconToyotaX aria-hidden="true" className="size-4 shrink-0" />
            <PopoverTitle className="subhead-lg text-text-primary">Your preferences</PopoverTitle>
          </div>
        </PopoverHeader>

        <p className="body-md text-text-secondary">{explanationText}</p>
      </div>

      <div className="flex flex-col gap-4" ref={dynamicContentRef}>
        {preferences.length > 0 ? (
          <ul aria-label="Active preferences" className="flex flex-wrap gap-2" ref={listRef}>
            {preferences.map((preference) => (
              <li
                className="flex flex-col items-end self-stretch"
                key={preference}
                ref={(element) => {
                  if (!element) {
                    chipRefs.current.delete(preference);
                    return;
                  }

                  chipRefs.current.set(preference, element);
                }}
              >
                <Chip
                  className="h-14 items-center justify-center gap-2 rounded-full bg-surface-primary py-3 pr-5 pl-6 hover:bg-surface-primary"
                  size="md"
                  variant="outline"
                >
                  <span>{preference}</span>
                  <button
                    aria-label={`Remove ${preference} preference`}
                    className="flex aspect-square items-center justify-center gap-2 rounded-full bg-surface-primary text-text-muted"
                    onClick={() => onDismissPreference(preference)}
                    type="button"
                  >
                    <IconClose aria-hidden="true" className="size-4 shrink-0 text-text-primary" />
                  </button>
                </Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted text-xs">No active preferences.</p>
        )}

        <div className="flex items-center justify-between" ref={closeButtonRowRef}>
          <Button
            aria-label="Save changes"
            className="h-12 rounded-full px-6 py-3 disabled:cursor-not-allowed"
            disabled={!hasUnsavedChanges}
            onClick={onSave}
            size="sm"
            variant="primary"
          >
            Save changes
          </Button>
          <Button
            aria-label="Close preferences panel"
            className="flex aspect-square h-10 w-10 items-center justify-center gap-2 rounded-full bg-surface-primary p-3"
            onClick={onClose}
            size="icon-sm"
            variant="text"
          >
            <IconClose aria-hidden="true" className="flex size-5 shrink-0 text-text-primary" />
          </Button>
        </div>
      </div>
    </>
  );
}
