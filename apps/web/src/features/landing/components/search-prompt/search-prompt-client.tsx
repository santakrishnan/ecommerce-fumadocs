"use client";

import type { SearchPreferencesPopoverProps } from "@features/landing/components/search-prompt";
import { Button, InputGroup, InputGroupAddon, InputGroupTextarea } from "@ucmp/ui";
import { IconClose } from "@ucmp/ui/icons";
import { cn } from "@ucmp/ui/lib/utils";
import { AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { SEARCH_PROMPT_PLACEHOLDERS } from "../../data/search-prompt";
import { useAutoResizeTextarea } from "../../hooks/use-auto-resize-textarea";
import { useImageAttachment } from "../../hooks/use-image-attachment";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useSearchSuggestions } from "../../hooks/use-search-suggestions";
import { useTypewriterPlaceholder } from "../../hooks/use-typewriter-placeholder";
import { useVoiceRecording } from "../../hooks/use-voice-recording";
import { MAX_QUERY_LENGTH, searchQuerySchema } from "../../lib/validate-search-query";
import type { AutocompleteService, Suggestion } from "../../services/autocomplete-service";
import { ActionButtons } from "./action-buttons";
import { DropZoneOverlay } from "./drop-zone-overlay";
import { AddImageButton, ImagePreview } from "./image-preview";
import { RecordingBar } from "./recording-bar";
import { SuggestionListbox } from "./suggestion-listbox";

/** Optional feature toggles for SearchPromptClient. */
export interface SearchPromptFeatures {
  /** Enable image attachment (drag-and-drop + picker). Default: false. */
  imageAttach?: boolean;
}

/** Props for the SearchPromptClient component. */
export interface SearchPromptClientProps {
  /** Injected autocomplete provider — swap mock for real without changing this component. */
  autocompleteService: AutocompleteService;
  /** Automatically focus the textarea on mount. Default: false. */
  autoFocus?: boolean;
  /** Pre-filled value (e.g., from URL query param). */
  defaultValue?: string;
  /** Enable the suggestion dropdown. When false, typing won't fetch or show suggestions. Default: false. */
  enableSuggestions?: boolean;
  /** Controlled submit-error message rendered above the input. */
  error?: string;
  /** Toggle optional capabilities. All disabled by default. */
  features?: SearchPromptFeatures;
  /** Max suggestions shown. Default: 5. */
  maxSuggestions?: number;
  /** Min characters before suggestions fetch. Default: 2. */
  minChars?: number;
  /** Dismisses the controlled submit-error notice. */
  onErrorDismiss?: () => void;
  /** Called when focus state changes (true = focused, false = blurred). */
  onFocusChange?: (focused: boolean) => void;
  /** Called when the user submits a search term. */
  onSubmit?: (query: string) => void;
  /** Called when the input value changes. */
  onValueChange?: (value: string) => void;
  /** Placeholder texts — rotates every 5 seconds. Accepts a string or array. */
  placeholder?: string | string[];
  /** Props for the search preferences popover, which is conditionally rendered in the action buttons. */
  searchPreferences?: SearchPreferencesPopoverProps;
  /**
   * Presentation variant.
   * - `'inline'` (default): centered hero placement, no safe-area padding.
   * - `'docked'`: bottom-pinned placement; adds `pb-[env(safe-area-inset-bottom)]`
   *   to the form wrapper so the input clears the iOS home indicator.
   */
  variant?: "inline" | "docked";
}

// ─── Main Component ─────────────────────────────────────────

/**
 * Search prompt with voice, image attach, and AI icons.
 * Renders an accessible autocomplete input with a suggestion listbox.
 *
 * Keyboard: Tab to focus, Enter to submit, Escape to close suggestions/clear.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Orchestrates multiple interactive states (suggestions, keyboard nav, form submit)
export function SearchPromptClient({
  autocompleteService,
  autoFocus = false,
  defaultValue = "",
  features: { imageAttach: imageEnabled = false } = {},
  enableSuggestions = false,
  error,
  maxSuggestions = 5,
  minChars = 2,
  onFocusChange,
  onErrorDismiss,
  onSubmit,
  onValueChange,
  placeholder = SEARCH_PROMPT_PLACEHOLDERS,
  searchPreferences,
  variant = "inline",
}: SearchPromptClientProps) {
  const placeholders = Array.isArray(placeholder) ? placeholder : [placeholder];
  const isMobile = useIsMobile();
  const activePlaceholders = isMobile ? [placeholders[0] ?? ""] : placeholders;

  // Always invoke the hook (required by React rules of hooks)
  // but only use its result if we have multiple placeholders
  const typewriterResult = useTypewriterPlaceholder(activePlaceholders);
  const shouldUseTypewriter = activePlaceholders.length > 1;

  const currentPlaceholder = shouldUseTypewriter
    ? typewriterResult.displayText
    : (activePlaceholders[0] ?? "");

  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isCharLimitNoticeDismissed, setIsCharLimitNoticeDismissed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const voice = useVoiceRecording();
  const images = useImageAttachment({ enabled: imageEnabled });
  const { isMultiline } = useAutoResizeTextarea(textareaRef, searchQuery);

  const { suggestions, clearSuggestions } = useSearchSuggestions(autocompleteService, searchQuery, {
    minChars: enableSuggestions ? minChars : Number.POSITIVE_INFINITY,
    maxSuggestions,
  });
  // ─── Derived State ──────────────────────────────────────

  const isExpanded = isMultiline || images.hasImages;
  const showSendInline = searchQuery.trim().length > 0 || images.hasImages;
  const showSuggestions = enableSuggestions && suggestions.length > 0 && isFocused && !isDismissed;
  const atCharLimit = searchQuery.length >= MAX_QUERY_LENGTH;
  const showCharLimitNotice = atCharLimit && !isCharLimitNoticeDismissed;
  const showSubmitErrorNotice = Boolean(error);
  const skipNextSuggestionExitRef = useRef(false);
  const textareaRightPaddingClass = isExpanded ? "pr-8" : "pr-2";

  // ─── Auto-focus on mount ─────────────────────────────────

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    onValueChange?.(searchQuery);
    // eslint-disable-next-line -- onValueChange is an event callback; re-firing
    // on callback identity change would cause cascading re-renders that break
    // the exit animation lifecycle. React Compiler handles memoization.
  }, [searchQuery]);

  // ─── Handlers ───────────────────────────────────────────

  const handleSubmit = (value: string) => {
    if (images.hasImages && !value.trim()) {
      // Image-only submission — pass trimmed value for consistency with text path
      onSubmit?.(value.trim());
      setIsDismissed(true);
      clearSuggestions();
      return;
    }

    // Truncate to max length before validation so long queries still go through
    const truncated = value.trim().slice(0, MAX_QUERY_LENGTH);
    const result = searchQuerySchema.safeParse(truncated);
    if (!result.success) {
      return;
    }

    onSubmit?.(result.data);
    setIsDismissed(true);
    clearSuggestions();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (voice.hasRecordedAudio) {
      // Recording was stopped and is ready to send. Reset recording state.
      // Audio submission to a speech-to-text API is handled externally.
      voice.cancelRecording();
    } else {
      handleSubmit(searchQuery);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDismissed(false);
    setActiveIndex(-1);
    // Re-show the notice if the user somehow fills back to the limit
    if (value.length < MAX_QUERY_LENGTH) {
      setIsCharLimitNoticeDismissed(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
        handleSuggestionSelect(suggestions[activeIndex]);
      } else {
        handleSubmit(searchQuery);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (showSuggestions) {
        setIsDismissed(true);
        clearSuggestions();
        setActiveIndex(-1);
      } else if (searchQuery) {
        setSearchQuery("");
        setIsDismissed(false);
        setActiveIndex(-1);
      }
    } else if (e.key === "Tab" && showSuggestions) {
      setIsDismissed(true);
      clearSuggestions();
      setActiveIndex(-1);
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
      setActiveIndex(-1);
      onFocusChange?.(false);
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    // Append suggestion to current query (query-builder pattern)
    const separator = searchQuery.trim() ? " " : "";
    const updatedQuery = `${searchQuery.trim()}${separator}${suggestion.label}`;
    // Skip exit animation — this is a refinement, not a dismissal.
    skipNextSuggestionExitRef.current = true;
    setSearchQuery(updatedQuery);
    clearSuggestions();
    setIsDismissed(false);
    setActiveIndex(-1);
    textareaRef.current?.focus();
  };

  // Determine placeholder text based on state
  const getPlaceholderText = () => {
    if (images.isDragging) {
      return "";
    }
    if (isFocused) {
      return "What are you looking for?";
    }
    return currentPlaceholder;
  };

  if (voice.isRecording || voice.hasRecordedAudio) {
    return (
      <RecordingBar
        hasRecordedAudio={voice.hasRecordedAudio}
        isRecording={voice.isRecording}
        onCancel={voice.cancelRecording}
        onStop={voice.stopRecording}
        onSubmit={handleFormSubmit}
      />
    );
  }

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Form needs drag-and-drop event handlers for image upload
    <form
      className={cn(
        "relative mx-auto w-full",
        variant === "docked" && "pb-[env(safe-area-inset-bottom)]"
      )}
      data-variant={variant}
      onDragEnter={images.handleDragEnter}
      onDragLeave={images.handleDragLeave}
      onDragOver={images.handleDragOver}
      onDrop={images.handleDrop}
      onSubmit={handleFormSubmit}
    >
      {imageEnabled && (
        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={images.handleFilesSelected}
          ref={images.fileInputRef}
          type="file"
        />
      )}

      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/noNoninteractiveElementInteractions: Focus/blur tracking for suggestion dropdown visibility */}
      <div className="relative" onBlur={handleBlur} onFocus={handleFocus} ref={containerRef}>
        <div className="rounded-4xl bg-black">
          {images.isDragging && (
            <DropZoneOverlay onClick={() => images.fileInputRef.current?.click()} />
          )}

          {/* Character limit notice */}
          {showCharLimitNotice && (
            <div
              className="flex w-full items-center justify-between rounded-4xl bg-black py-4 pr-10 pl-8 text-text-primary"
              data-surface="dark"
            >
              <span className="body-md">You've reached the {MAX_QUERY_LENGTH} character limit</span>
              <Button
                aria-label="Dismiss character limit notice"
                className="ml-4 size-5 min-h-0 min-w-0 shrink-0"
                leadingIcon={IconClose}
                onClick={() => setIsCharLimitNoticeDismissed(true)}
                size="icon-sm"
                type="button"
                variant="text"
              />
            </div>
          )}

          {showSubmitErrorNotice && (
            <div
              className="flex w-full items-center justify-between rounded-4xl bg-black py-4 pr-10 pl-8 text-text-primary"
              data-surface="dark"
            >
              <span className="body-md">{error}</span>
              <Button
                aria-label="Dismiss search error"
                className="ml-4 size-5 min-h-0 min-w-0 shrink-0"
                leadingIcon={IconClose}
                onClick={onErrorDismiss}
                size="icon-sm"
                type="button"
                variant="text"
              />
            </div>
          )}

          <InputGroup
            className={cn(
              "h-auto min-h-16 border-0 bg-surface-primary shadow-none",
              "has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0",
              "transition-all duration-200 ease-in-out",
              isExpanded ? "flex-col rounded-3xl" : "rounded-4xl",
              "overflow-hidden",
              images.isDragging && "pointer-events-none"
            )}
          >
            {/* Image attachments */}
            {images.hasImages && (
              <InputGroupAddon align="block-start" className="px-8 pt-5 pb-2">
                <div className="scrollbar-none flex gap-3 overflow-x-auto pt-2 pr-2">
                  {images.attachedImages.map((src, index) => (
                    <ImagePreview
                      alt={`Attachment ${index + 1}`}
                      key={src}
                      onRemove={() => images.removeImage(index)}
                      src={src}
                    />
                  ))}
                  <AddImageButton onClick={images.openFilePicker} />
                </div>
              </InputGroupAddon>
            )}

            {/* Textarea */}
            <InputGroupTextarea
              aria-activedescendant={
                showSuggestions && activeIndex >= 0
                  ? `suggestion-${suggestions[activeIndex]?.value}`
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={showSuggestions}
              aria-label="Search vehicles"
              className={cn(
                "body-md text-text-primary",
                isExpanded
                  ? "w-full overflow-y-auto pt-4 pl-8"
                  : "flex-1 overflow-hidden py-2.5 pl-8",
                textareaRightPaddingClass,
                "placeholder:text-text-tertiary",
                "placeholder:font-normal placeholder:tracking-tighter"
              )}
              maxLength={MAX_QUERY_LENGTH}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              // iOS Safari sometimes does not focus the textarea when the user taps
              // inside the form area but outside the textarea itself (e.g. padding zone).
              // An explicit focus() on touchstart ensures the keyboard opens reliably.
              onTouchStart={isMobile ? () => textareaRef.current?.focus() : undefined}
              placeholder={getPlaceholderText()}
              ref={textareaRef}
              role="combobox"
              rows={1}
              // Dynamic height for auto-sizing textarea — inline style required for JS-driven measurement
              style={{
                minHeight: isExpanded ? "60px" : "44px",
                maxHeight: "300px",
                height: isExpanded ? undefined : "44px",
              }}
              value={searchQuery}
            />

            {/* Action buttons */}
            <InputGroupAddon
              align={isExpanded ? "block-end" : "inline-end"}
              className={isExpanded ? "w-full px-8 pt-0 pb-4" : "pr-8"}
            >
              <ActionButtons
                isExpanded={isExpanded}
                onImageAttach={imageEnabled ? images.openFilePicker : undefined}
                onMicClick={voice.toggleRecording}
                onSend={() => handleSubmit(searchQuery)}
                searchPreferences={searchPreferences}
                showSend={showSendInline}
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
        {/* Suggestion count announcement for screen readers */}
        <div aria-atomic="true" aria-live="polite" className="sr-only">
          {showSuggestions && `${suggestions.length} suggestions available`}
        </div>

        {/* Suggestion listbox — lifecycle is owned by AnimatePresence so enter/
            exit sequencing is declarative (no manual timers).
            custom forwards the skip-exit intent at the moment of removal so the
            exit variant function in SuggestionListbox can read the latest value —
            a plain prop would be stale because Motion captures exit values from
            the last rendered state, before the ref was set. */}
        <AnimatePresence
          custom={skipNextSuggestionExitRef.current}
          initial={false}
          onExitComplete={() => {
            skipNextSuggestionExitRef.current = false;
          }}
        >
          {showSuggestions && (
            <SuggestionListbox
              activeIndex={activeIndex}
              onScrollDismiss={() => textareaRef.current?.blur()}
              onSelect={handleSuggestionSelect}
              suggestions={suggestions}
            />
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
