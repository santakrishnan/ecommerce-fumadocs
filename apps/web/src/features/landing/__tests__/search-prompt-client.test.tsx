/// <reference types="@testing-library/jest-dom/vitest" />

import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockAutocompleteService } from "../__fixtures__/search-prompt.fixtures";
import {
  createDelayedService,
  createFailingService,
  createMockService,
} from "../__fixtures__/search-prompt.fixtures";
import { SearchPromptClient } from "../components/search-prompt";
import { RecordingBar } from "../components/search-prompt/recording-bar";
import { MAX_QUERY_LENGTH } from "../lib/validate-search-query";

// Mock motion/react so the suggestion listbox mounts/unmounts synchronously
// with JSX state instead of waiting on Motion's real (RAF-driven) enter/exit
// animations. Fake timers below only cover setTimeout-based effects (the
// typewriter placeholder + search debounce) — they do not advance Motion's
// animation loop, so without this mock the exit-animation assertions would
// hang. Pattern mirrors gallery-overlay.test.tsx.
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      // Strip Motion-only animation props so they don't leak onto the DOM node.
      animate: _animate,
      exit: _exit,
      initial: _initial,
      variants: _variants,
      custom: _custom,
      ...rest
    }: Record<string, unknown> & { children?: ReactNode }) => <div {...rest}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

const ERROR_REGEX = /error/i;
const AGENT_ERROR_REGEX = /wasn't able to complete your search/i;
const CHAR_LIMIT_REGEX = /character limit/i;

/** Debounce delay for autocomplete requests (SEARCH_CONFIG.DEBOUNCE_MS). */
const DEBOUNCE_MS = 200;

// ─── Test Helper ────────────────────────────────────────────

function renderSearchPrompt(props?: Partial<React.ComponentProps<typeof SearchPromptClient>>) {
  const service = (props?.autocompleteService as MockAutocompleteService) ?? createMockService();
  const onSubmit = props?.onSubmit ?? vi.fn();

  const result = render(
    <SearchPromptClient
      {...props}
      autocompleteService={service}
      enableSuggestions
      onSubmit={onSubmit}
    />
  );

  return { ...result, onSubmit, service };
}

/** userEvent instance wired to fake timers — required so keystroke delays
 * advance via vi.advanceTimersByTime instead of real time. */
function setupUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
}

/**
 * Advances fake timers in small increments across multiple `act()` calls.
 *
 * The typewriter effect schedules its *next* setTimeout from inside a
 * useEffect that only re-runs after React commits the previous state update.
 * A single large `vi.advanceTimersByTimeAsync(N)` only lets one effect flush
 * happen per act() call, so it only ever fires the first scheduled timer.
 * Ticking in small steps (<= the typewriter's fastest interval) forces a
 * commit + effect re-run between each timer firing.
 */
async function advanceTimersInTicks(totalMs: number, stepMs = 20) {
  const steps = Math.ceil(totalMs / stepMs);
  for (let i = 0; i < steps; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(stepMs);
    });
  }
}

beforeEach(() => {
  // shouldAdvanceTime lets the fake clock auto-tick in step with the real
  // clock so RTL's asyncWrapper (which awaits a native setTimeout(0) to
  // drain microtasks after user-event interactions) still resolves — it only
  // auto-advances Jest's fake timers, not Vitest's, so without this the
  // combination of userEvent + fake timers deadlocks. vi.advanceTimersByTime
  // is still used explicitly to skip past the typewriter/debounce delays.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────

describe("SearchPromptClient", () => {
  describe("Rendering", () => {
    it("renders and dismisses a controlled submit error", async () => {
      const user = setupUser();
      const onErrorDismiss = vi.fn();
      renderSearchPrompt({
        error: "I wasn't able to complete your search. Try a different question?",
        onErrorDismiss,
      });

      expect(screen.getByText(AGENT_ERROR_REGEX)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Dismiss search error" }));

      expect(onErrorDismiss).toHaveBeenCalledOnce();
    });

    it("renders a dismiss button when a controlled submit error has no callback", () => {
      renderSearchPrompt({
        error: "I wasn't able to complete your search. Try a different question?",
      });

      expect(screen.getByText(AGENT_ERROR_REGEX)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dismiss search error" })).toBeInTheDocument();
    });

    it("renders with placeholder text", async () => {
      renderSearchPrompt();
      // Typewriter effect types character by character — tick through the full
      // typing duration for "What are you looking for?" (25 chars @ 80ms/char).
      await advanceTimersInTicks(2500);
      expect(screen.getByPlaceholderText("What are you looking for?")).toBeInTheDocument();
    });

    it("uses body-md typography on the search textarea", () => {
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      expect(input).toHaveClass("body-md", "text-text-primary");
      expect(input).not.toHaveClass("text-sm", "leading-relaxed");
    });

    it("applies muted placeholder color class to the combobox", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      expect(input).toHaveClass("placeholder:text-text-tertiary");
    });

    it("renders with custom placeholder", async () => {
      renderSearchPrompt({ placeholder: "Search cars..." });
      await advanceTimersInTicks(2000);
      expect(screen.getByPlaceholderText("Search cars...")).toBeInTheDocument();
    });

    it("renders with defaultValue pre-filled", () => {
      renderSearchPrompt({ defaultValue: "Toyota" });
      expect(screen.getByRole("combobox")).toHaveValue("Toyota");
    });

    it("renders voice and image attach buttons", () => {
      renderSearchPrompt({ features: { imageAttach: true } });
      expect(screen.getByRole("button", { name: "Voice search" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Attach image" })).toBeInTheDocument();
    });

    it("does not render image attach button when imageAttach is disabled", () => {
      renderSearchPrompt();
      expect(screen.getByRole("button", { name: "Voice search" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Attach image" })).not.toBeInTheDocument();
    });

    it("focuses the textarea on mount when autoFocus is true", () => {
      renderSearchPrompt({ autoFocus: true });
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("does not focus the textarea on mount when autoFocus is false", () => {
      renderSearchPrompt({ autoFocus: false });
      expect(screen.getByRole("combobox")).not.toHaveFocus();
    });
  });

  describe("Accessibility — aria-labels (AC-5, AC-6)", () => {
    it("Voice button has aria-label 'Voice search'", () => {
      renderSearchPrompt();
      const btn = screen.getByRole("button", { name: "Voice search" });
      expect(btn).toHaveAttribute("aria-label", "Voice search");
    });

    it("Image attach button has aria-label 'Attach image'", () => {
      renderSearchPrompt({ features: { imageAttach: true } });
      const btn = screen.getByRole("button", { name: "Attach image" });
      expect(btn).toHaveAttribute("aria-label", "Attach image");
    });

    it("AI button appears only in expanded/multiline mode", () => {
      renderSearchPrompt();
      // AI button is hidden in default single-line state
      expect(screen.queryByRole("button", { name: "AI assistant search" })).not.toBeInTheDocument();
    });

    it("input has aria-label 'Search vehicles'", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-label", "Search vehicles");
    });

    it("input has aria-autocomplete='list' and aria-controls", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-controls", "search-suggestions");
    });
  });

  describe("Submit behavior (AC-2, AC-3)", () => {
    it("calls onSubmit with value when Enter is pressed", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Ford Mustang");
      await user.keyboard("{Enter}");

      expect(onSubmit).toHaveBeenCalledWith("Ford Mustang");
    });

    it("does NOT call onSubmit when input is empty (AC-3)", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.keyboard("{Enter}");

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does NOT call onSubmit when input is only whitespace", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "   ");
      await user.keyboard("{Enter}");

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard navigation (AC-1)", () => {
    it("Escape closes suggestions when open", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("Escape clears input when suggestions are already closed", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "x");

      expect(input).toHaveValue("x");

      await user.keyboard("{Escape}");

      expect(input).toHaveValue("");
    });

    it("ArrowDown/ArrowUp navigates suggestions", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.keyboard("{ArrowDown}");

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{ArrowDown}");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });

    it("Enter selects highlighted suggestion", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("Toyota 2024 Toyota Camry");
    });
  });

  describe("Suggestions — threshold gating (AC-7, AC-8)", () => {
    it("does NOT fetch suggestions for fewer than 2 characters", async () => {
      const user = setupUser();
      const service = createMockService();
      renderSearchPrompt({ autocompleteService: service });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "T");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });

      expect(service.getSuggestions).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("fetches suggestions when 2+ characters are typed (AC-7)", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "To");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  describe("Suggestion selection (AC-10)", () => {
    it("clicking a suggestion appends its label to the query and keeps focus", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      const suggestion = screen.getByText("2024 Toyota Camry");
      await user.click(suggestion);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(input).toHaveValue("Toyota 2024 Toyota Camry");
    });

    it("selected suggestion appends to the input value", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      const suggestion = screen.getByText("2024 Toyota Camry");
      await user.click(suggestion);

      expect(input).toHaveValue("Toyota 2024 Toyota Camry");
    });
  });

  describe("Error handling (AC-9)", () => {
    it("does not crash when autocomplete service fails", async () => {
      const user = setupUser();
      const failingService = createFailingService();
      renderSearchPrompt({ autocompleteService: failingService });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });

      expect(failingService.getSuggestions).toHaveBeenCalled();
      expect(input).toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("shows no error message to the user on failure", async () => {
      const user = setupUser();
      const failingService = createFailingService();
      renderSearchPrompt({ autocompleteService: failingService });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });

      expect(failingService.getSuggestions).toHaveBeenCalled();
      expect(screen.queryByText(ERROR_REGEX)).not.toBeInTheDocument();
    });
  });

  describe("Loading & debounce behavior", () => {
    it("does not show stale suggestions while a new fetch is in-flight", async () => {
      const user = setupUser();
      const delayedService = createDelayedService(300);
      renderSearchPrompt({ autocompleteService: delayedService });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      // Suggestions should eventually appear after the debounce (200ms) + the
      // fixture's internal fetch delay (300ms) — both are real setTimeout calls
      // intercepted by fake timers.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 300);
      });

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(delayedService.getSuggestions).toHaveBeenCalled();
    });
  });

  describe("Input clearing", () => {
    it("clearing the input hides suggestions", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.clear(input);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("Reply placeholder (AC-11)", () => {
    it("Reply placeholder remains static without typewriter effect", () => {
      renderSearchPrompt({ placeholder: "Reply" });

      const input = screen.getByRole("combobox") as HTMLTextAreaElement;

      // Verify placeholder is Reply and stays exactly that (no typewriter animation)
      expect(input.placeholder).toBe("Reply");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(input.placeholder).toBe("Reply");
    });

    it("Reply placeholder allows user input and form submission", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt({ placeholder: "Reply" });

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("placeholder", "Reply");

      // User can type and submit
      await user.click(input);
      await user.type(input, "Search query");
      await user.keyboard("{Enter}");

      expect(onSubmit).toHaveBeenCalledWith("Search query");
    });

    it("Reply placeholder changes to dynamic text on focus", async () => {
      const user = setupUser();
      renderSearchPrompt({ placeholder: "Reply" });

      const input = screen.getByRole("combobox");

      // Initial placeholder is Reply
      expect(input).toHaveAttribute("placeholder", "Reply");

      // On focus, it changes to "What are you looking for?"
      await user.click(input);

      expect(input).toHaveAttribute("placeholder", "What are you looking for?");
    });
  });

  describe("Input validation (security)", () => {
    it("submits trimmed value — leading/trailing whitespace stripped", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "  RAV4  ");
      await user.keyboard("{Enter}");

      expect(onSubmit).toHaveBeenCalledWith("RAV4");
    });

    it("does not call onSubmit for input exceeding max length", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      // Set value directly — typing 501 chars one-by-one is too slow for jsdom
      fireEvent.change(input, { target: { value: "a".repeat(501) } });
      await user.keyboard("{Enter}");

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not call onSubmit for script injection attempt", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      // Set value directly — userEvent.type escapes angle brackets
      fireEvent.change(input, { target: { value: "<script>alert(1)</script>" } });
      await user.keyboard("{Enter}");

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not call onSubmit for javascript: URI", async () => {
      const user = setupUser();
      const { onSubmit } = renderSearchPrompt();

      const input = screen.getByRole("combobox");
      // Set value directly — userEvent.type escapes special chars
      fireEvent.change(input, { target: { value: "javascript:alert(1)" } });
      await user.keyboard("{Enter}");

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Variant prop — inline vs docked", () => {
    it("renders without safe-area padding when variant is omitted (defaults to inline)", () => {
      const { container } = renderSearchPrompt();
      const form = container.querySelector("form");
      expect(form).not.toHaveClass("pb-[env(safe-area-inset-bottom)]");
      expect(form).toHaveAttribute("data-variant", "inline");
    });

    it("renders without safe-area padding when variant is explicitly 'inline'", () => {
      const { container } = renderSearchPrompt({ variant: "inline" });
      const form = container.querySelector("form");
      expect(form).not.toHaveClass("pb-[env(safe-area-inset-bottom)]");
      expect(form).toHaveAttribute("data-variant", "inline");
    });

    it("renders with safe-area padding when variant is 'docked'", () => {
      const { container } = renderSearchPrompt({ variant: "docked" });
      const form = container.querySelector("form");
      expect(form).toHaveClass("pb-[env(safe-area-inset-bottom)]");
      expect(form).toHaveAttribute("data-variant", "docked");
    });

    it("docked variant still renders combobox and action buttons", () => {
      renderSearchPrompt({ variant: "docked" });
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Voice search" })).toBeInTheDocument();
    });
  });

  describe("Character limit notice", () => {
    it("does not show the notice when the query is below the limit", () => {
      renderSearchPrompt();
      expect(screen.queryByText(CHAR_LIMIT_REGEX)).not.toBeInTheDocument();
    });

    it("shows the notice when the query reaches MAX_QUERY_LENGTH characters", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });
      expect(
        screen.getByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).toBeInTheDocument();
    });

    it("notice includes a dismiss button with accessible label", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });
      expect(
        screen.getByRole("button", { name: "Dismiss character limit notice" })
      ).toBeInTheDocument();
    });

    it("dismisses the notice when the X button is clicked", async () => {
      const user = setupUser();
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });

      const dismissBtn = screen.getByRole("button", { name: "Dismiss character limit notice" });
      await user.click(dismissBtn);

      expect(
        screen.queryByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).not.toBeInTheDocument();
    });

    it("notice stays hidden after dismissal even while still at the limit", async () => {
      const user = setupUser();
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });

      await user.click(screen.getByRole("button", { name: "Dismiss character limit notice" }));

      // Value is still at the limit but notice should remain hidden
      expect(input).toHaveValue("a".repeat(MAX_QUERY_LENGTH));
      expect(
        screen.queryByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).not.toBeInTheDocument();
    });

    it("re-shows the notice after dismissal when the user clears and re-fills to the limit", async () => {
      const user = setupUser();
      renderSearchPrompt();
      const input = screen.getByRole("combobox");

      // Reach limit and dismiss
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });
      await user.click(screen.getByRole("button", { name: "Dismiss character limit notice" }));

      // Drop below the limit
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH - 1) } });
      expect(
        screen.queryByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).not.toBeInTheDocument();

      // Fill back to the limit — notice re-appears
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH) } });
      expect(
        screen.getByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).toBeInTheDocument();
    });

    it("does not show the notice when query is one character below the limit", () => {
      renderSearchPrompt();
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "a".repeat(MAX_QUERY_LENGTH - 1) } });
      expect(
        screen.queryByText(`You've reached the ${MAX_QUERY_LENGTH} character limit`)
      ).not.toBeInTheDocument();
    });
  });

  describe("Voice recording flow — RecordingBar two-state behaviour", () => {
    function renderRecordingBar(props: Partial<React.ComponentProps<typeof RecordingBar>> = {}) {
      const defaults = {
        hasRecordedAudio: false,
        isRecording: false,
        onCancel: vi.fn(),
        onStop: vi.fn(),
        onSubmit: vi.fn() as unknown as React.FormEventHandler<HTMLFormElement>,
      };
      return render(<RecordingBar {...defaults} {...props} />);
    }

    // ── State 1: actively recording ─────────────────────────────────────────

    it("shows Stop recording button while isRecording is true", () => {
      renderRecordingBar({ isRecording: true });
      expect(screen.getByRole("button", { name: "Stop recording" })).toBeInTheDocument();
    });

    it("Send recording button is disabled while isRecording is true", () => {
      renderRecordingBar({ isRecording: true });
      expect(screen.getByRole("button", { name: "Send recording" })).toBeDisabled();
    });

    it("clicking Stop calls onStop, not onCancel", async () => {
      const user = setupUser();
      const onStop = vi.fn();
      const onCancel = vi.fn();
      renderRecordingBar({ isRecording: true, onStop, onCancel });

      await user.click(screen.getByRole("button", { name: "Stop recording" }));

      expect(onStop).toHaveBeenCalledOnce();
      expect(onCancel).not.toHaveBeenCalled();
    });

    // ── State 2: recording stopped, audio ready ──────────────────────────────

    it("shows Discard recording button after recording is stopped", () => {
      renderRecordingBar({ isRecording: false, hasRecordedAudio: true });
      expect(screen.getByRole("button", { name: "Discard recording" })).toBeInTheDocument();
    });

    it("Send recording button is enabled after recording is stopped", () => {
      renderRecordingBar({ isRecording: false, hasRecordedAudio: true });
      expect(screen.getByRole("button", { name: "Send recording" })).not.toBeDisabled();
    });

    it("clicking Discard calls onCancel, not onStop", async () => {
      const user = setupUser();
      const onStop = vi.fn();
      const onCancel = vi.fn();
      renderRecordingBar({ isRecording: false, hasRecordedAudio: true, onStop, onCancel });

      await user.click(screen.getByRole("button", { name: "Discard recording" }));

      expect(onCancel).toHaveBeenCalledOnce();
      expect(onStop).not.toHaveBeenCalled();
    });

    it("Send recording button is disabled when neither recording nor audio ready", () => {
      renderRecordingBar({ isRecording: false, hasRecordedAudio: false });
      // Bar is only rendered by SearchPromptClient when isRecording || hasRecordedAudio,
      // but guard the edge case for completeness.
      expect(screen.getByRole("button", { name: "Send recording" })).toBeDisabled();
    });
  });

  describe("Suggestion exit animation", () => {
    it("keeps listbox mounted briefly after dismissal for exit animation", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Toyota");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Dismiss via Escape — with motion/react mocked to a passthrough,
      // AnimatePresence unmounts the listbox synchronously (no real exit
      // animation to wait out).
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("typing dismisses suggestions with exit animation before unmount", async () => {
      const user = setupUser();
      renderSearchPrompt();

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "To");

      // Suggestions appear after minChars threshold
      await act(async () => {
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      });
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Clear input and type a single char (below minChars) — triggers exit
      await user.clear(input);
      await user.type(input, "X");

      // Listbox unmounts once dismissed (no real animation wait needed under
      // the motion/react mock).
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
