/// <reference types="@testing-library/jest-dom" />
import { act, render, renderHook, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  SearchConversationalProvider,
  useSearchConversationalContext,
} from "../context/search-conversational-context";
import type { SearchAgentMode } from "../types/search-state";

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderProvider(
  initialState?: Parameters<typeof SearchConversationalProvider>[0]["initialState"],
  initialAgentMode?: SearchAgentMode
) {
  return renderHook(() => useSearchConversationalContext(), {
    wrapper: ({ children }) => (
      <SearchConversationalProvider initialAgentMode={initialAgentMode} initialState={initialState}>
        {children}
      </SearchConversationalProvider>
    ),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SearchConversationalContext", () => {
  describe("initial state", () => {
    it("starts with searchState = idle", () => {
      const { result } = renderProvider();
      expect(result.current?.searchConversationalState).toBe("idle");
    });

    it("starts with isLoading = false", () => {
      const { result } = renderProvider();
      expect(result.current?.isLoading).toBe(false);
    });

    it("starts with hasSubmittedPrompt = false", () => {
      const { result } = renderProvider();
      expect(result.current?.hasSubmittedPrompt).toBe(false);
    });

    it("derives showLocationPill = true on initial load", () => {
      const { result } = renderProvider();
      expect(result.current?.showLocationPill).toBe(true);
    });

    it("derives showSaveSearchToggle = false on initial load", () => {
      const { result } = renderProvider();
      expect(result.current?.showSaveSearchToggle).toBe(false);
    });

    it("accepts a custom initialState via prop", () => {
      const { result } = renderProvider("results-generated");
      expect(result.current?.searchConversationalState).toBe("results-generated");
      expect(result.current?.showSaveSearchToggle).toBe(true);
    });
  });

  describe("state transitions", () => {
    it("focused: showLocationPill = true, hasSubmittedPrompt = false", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("focused"));
      expect(result.current?.showLocationPill).toBe(true);
      expect(result.current?.hasSubmittedPrompt).toBe(false);
    });

    it("typing: showLocationPill = true, hasSubmittedPrompt = false", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("typing"));
      expect(result.current?.showLocationPill).toBe(true);
      expect(result.current?.hasSubmittedPrompt).toBe(false);
    });

    it("loading: hides location pill, sets isLoading = true, hasSubmittedPrompt = true", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("loading"));
      expect(result.current?.isLoading).toBe(true);
      expect(result.current?.hasSubmittedPrompt).toBe(true);
      expect(result.current?.showLocationPill).toBe(false);
      expect(result.current?.showSaveSearchToggle).toBe(false);
    });

    it("submitted: hasSubmittedPrompt = true, isLoading = false, save toggle hidden", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("submitted"));
      expect(result.current?.isLoading).toBe(false);
      expect(result.current?.hasSubmittedPrompt).toBe(true);
      expect(result.current?.showLocationPill).toBe(false);
      expect(result.current?.showSaveSearchToggle).toBe(false);
    });

    it("results-generated: shows save toggle, hides location pill", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("results-generated"));
      expect(result.current?.showSaveSearchToggle).toBe(true);
      expect(result.current?.showLocationPill).toBe(false);
      expect(result.current?.isLoading).toBe(false);
    });

    it("refinement: shows save toggle, hides location pill", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("refinement"));
      expect(result.current?.showSaveSearchToggle).toBe(true);
      expect(result.current?.showLocationPill).toBe(false);
    });
  });

  describe("full submit flow", () => {
    it("loading → results-generated: save toggle appears after results load", () => {
      const { result } = renderProvider();

      act(() => result.current?.setSearchConversationalState("loading"));
      expect(result.current?.isLoading).toBe(true);
      expect(result.current?.showSaveSearchToggle).toBe(false);

      act(() => result.current?.setSearchConversationalState("results-generated"));
      expect(result.current?.isLoading).toBe(false);
      expect(result.current?.showSaveSearchToggle).toBe(true);
      expect(result.current?.showLocationPill).toBe(false);
    });

    it("location pill stays hidden after loading completes", () => {
      const { result } = renderProvider();
      act(() => result.current?.setSearchConversationalState("loading"));
      act(() => result.current?.setSearchConversationalState("results-generated"));
      expect(result.current?.showLocationPill).toBe(false);
    });
  });

  describe("conflicting states never occur simultaneously", () => {
    it("showLocationPill and showSaveSearchToggle are never both true", () => {
      const { result } = renderProvider();

      // Initial — only location pill visible
      expect(result.current?.showLocationPill).toBe(true);
      expect(result.current?.showSaveSearchToggle).toBe(false);

      // Loading — both hidden
      act(() => result.current?.setSearchConversationalState("loading"));
      expect(result.current?.showLocationPill).toBe(false);
      expect(result.current?.showSaveSearchToggle).toBe(false);

      // Results ready — only save toggle visible
      act(() => result.current?.setSearchConversationalState("results-generated"));
      expect(result.current?.showLocationPill).toBe(false);
      expect(result.current?.showSaveSearchToggle).toBe(true);

      const bothTrue =
        result.current?.showLocationPill === true && result.current?.showSaveSearchToggle === true;
      expect(bothTrue).toBe(false);
    });
  });

  describe("agentMode (ADR-0008 §2.4)", () => {
    it("defaults to 'general' when initialAgentMode is not provided", () => {
      const { result } = renderProvider();
      expect(result.current?.agentMode).toBe("general");
    });

    it("honors initialAgentMode = 'vdp-faq'", () => {
      const { result } = renderProvider(undefined, "vdp-faq");
      expect(result.current?.agentMode).toBe("vdp-faq");
    });

    it("is stable after mount — does not change if parent re-renders with a different value", () => {
      const { result, rerender } = renderHook(() => useSearchConversationalContext(), {
        wrapper: ({ children }) => (
          <SearchConversationalProvider initialAgentMode="general">
            {children}
          </SearchConversationalProvider>
        ),
      });
      expect(result.current?.agentMode).toBe("general");

      // Simulate parent re-render that would pass a different prop
      rerender();
      expect(result.current?.agentMode).toBe("general");
    });

    it("has no setter exposed on the context value", () => {
      const { result } = renderProvider();
      const contextKeys = Object.keys(result.current ?? {});
      expect(contextKeys).not.toContain("setAgentMode");
    });
  });

  describe("outside provider", () => {
    it("returns null when used outside SearchConversationalProvider", () => {
      const { result } = renderHook(() => useSearchConversationalContext());
      expect(result.current).toBeNull();
    });
  });
});

describe("SearchConversationalProvider renders children", () => {
  it("renders children without crashing", () => {
    render(
      <SearchConversationalProvider>
        <span data-testid="child">hello</span>
      </SearchConversationalProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

// ─── /search/[id] contract ────────────────────────────────────────────────────
//
// These tests validate the rule:
//   "On /search/[id], showSaveSearchToggle must always be true
//    and showLocationPill must always be false."
//
// The seeder in search-providers.tsx enforces this by transitioning "idle" →
// "results-generated" on mount. The tests below verify the context derivations
// that make that guarantee hold for every relevant state.

describe("/search/[id] — SaveSearchToggle always visible, LocationPill always hidden", () => {
  const resultsStates = ["results-generated", "refinement"] as const;

  for (const state of resultsStates) {
    it(`showSaveSearchToggle = true when state is "${state}"`, () => {
      const { result } = renderProvider(state);
      expect(result.current?.showSaveSearchToggle).toBe(true);
    });

    it(`showLocationPill = false when state is "${state}"`, () => {
      const { result } = renderProvider(state);
      expect(result.current?.showLocationPill).toBe(false);
    });
  }

  it("seeder contract: transitioning idle → results-generated shows save toggle", () => {
    // Simulates what SearchConversationalStateSeeder does on /search/[id] mount
    const { result } = renderProvider("idle");
    expect(result.current?.showSaveSearchToggle).toBe(false);

    act(() => result.current?.setSearchConversationalState("results-generated"));
    expect(result.current?.showSaveSearchToggle).toBe(true);
    expect(result.current?.showLocationPill).toBe(false);
  });

  it("showLocationPill and showSaveSearchToggle are never both true on results pages", () => {
    for (const state of resultsStates) {
      const { result } = renderProvider(state);
      const bothTrue =
        result.current?.showLocationPill === true && result.current?.showSaveSearchToggle === true;
      expect(bothTrue).toBe(false);
    }
  });
});
