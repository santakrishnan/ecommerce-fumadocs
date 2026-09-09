/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Polyfills for jsdom ─────────────────────────────────────────────────────

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "test-search-id" }),
  usePathname: () => "/search/test-search-id",
  useSearchParams: () => new URLSearchParams(),
}));

const mockSubmitTurn = vi.fn();

vi.mock("../../../hooks/use-ephemeral-agent-search-turns", () => ({
  useEphemeralAgentSearchTurns: () => ({
    turns: [],
    isLoading: false,
    isStreaming: false,
    submitTurn: mockSubmitTurn,
    cancel: vi.fn(),
    searchId: "ephemeral-test-id",
  }),
}));

vi.mock("../../../hooks/use-agent-search-turns", () => ({
  useAgentSearchTurns: () => ({
    turns: [],
    isLoading: false,
    isStreaming: false,
    submitTurn: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("../../../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

vi.mock("../../../hooks/use-auto-submit-turn-handler", () => ({
  useAutoSubmitTurnHandler: vi.fn().mockReturnValue("done"),
}));

vi.mock("../../../context/search-conversational-context", () => ({
  useSearchConversationalContext: () => null,
}));

vi.mock("@features/landing/components/search-prompt/search-prompt-client", () => ({
  SearchPromptClient: ({
    placeholder,
  }: {
    onSubmit: (q: string) => void;
    placeholder?: string | string[];
  }) => (
    <div data-testid="search-prompt">
      <input
        aria-label="search"
        data-placeholder={Array.isArray(placeholder) ? placeholder[0] : placeholder}
        readOnly
      />
    </div>
  ),
}));

vi.mock("../../../hooks/use-prefetch-filters", () => ({
  usePrefetchFilters: vi.fn(),
}));

vi.mock("../../../hooks/use-search-preferences-refinement", () => ({
  useSearchPreferencesRefinement: () => ({
    resetRefinement: vi.fn(),
    searchPreferences: { preferences: [], explanationText: "" },
    markRefinementTurn: vi.fn(),
  }),
}));

vi.mock("../../../lib/render-result-card", () => ({
  createResultCardRenderer: (_submitTurn: unknown, _options?: unknown) => (_item: unknown) => (
    <div data-testid="read-only-card">card</div>
  ),
}));

// Import after mocks
import { SearchResultsOrchestrator } from "../search-results-orchestrator";

beforeEach(() => {
  mockSubmitTurn.mockClear();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SearchResultsOrchestrator — ephemeral mode", () => {
  it("renders without crashing when ephemeral is true", () => {
    render(<SearchResultsOrchestrator ephemeral />);
    expect(screen.getByTestId("search-prompt")).toBeInTheDocument();
  });

  it("renders the search prompt in ephemeral mode", () => {
    render(<SearchResultsOrchestrator ephemeral placeholder="Ask about this vehicle..." />);
    const input = screen.getByRole("textbox", { name: "search" });
    expect(input).toHaveAttribute("data-placeholder", "Ask about this vehicle...");
  });

  it("renders the header slot in ephemeral mode", () => {
    render(
      <SearchResultsOrchestrator
        ephemeral
        header={<div data-testid="vdp-header">2024 Toyota Camry</div>}
      />
    );
    expect(screen.getByTestId("vdp-header")).toBeInTheDocument();
    expect(screen.getByText("2024 Toyota Camry")).toBeInTheDocument();
  });

  it("submits initialQuery after a delay when ephemeral is true", () => {
    vi.useFakeTimers();

    render(<SearchResultsOrchestrator ephemeral initialQuery="Tell me about this car" />);

    // Should not be called immediately
    expect(mockSubmitTurn).not.toHaveBeenCalled();

    // Advance past the 800ms delay
    vi.advanceTimersByTime(800);

    expect(mockSubmitTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "Tell me about this car",
        location: expect.objectContaining({
          zipCode: expect.any(String),
        }),
      })
    );

    vi.useRealTimers();
  });

  it("does not submit initialQuery before the delay elapses", () => {
    vi.useFakeTimers();

    render(<SearchResultsOrchestrator ephemeral initialQuery="What's the MPG?" />);

    // Advance only 500ms (less than the 800ms delay)
    vi.advanceTimersByTime(500);

    expect(mockSubmitTurn).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
