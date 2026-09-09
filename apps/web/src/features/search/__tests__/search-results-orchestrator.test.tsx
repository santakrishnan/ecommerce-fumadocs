/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  placeholderArray,
  placeholderString,
  turnCompleteWith6InventoryCards,
  turnCompleteWith8InventoryCards,
  turnCompleteWithInventoryCards,
  turnCompleteWithOptionCards,
  turnCompleteWithTextOnly,
  turnError,
  turnPending,
  turnStreaming,
} from "../__fixtures__/search-results-orchestrator.fixture";
import type { UseAgentSearchTurnsResult } from "../hooks/use-agent-search-turns";
import type { AgentSearchResponse, AgentSearchTurn } from "../lib/agent-search-turns-collection";

const turnCompleteWithModelColors: AgentSearchTurn = {
  ...turnCompleteWithOptionCards,
  response: {
    responseMode: "OptionCards",
    summary: "Color-rich model options",
    totalCount: 1,
    optionLevel: "Model",
    nextSearchPlan: { searchId: "00000000-0000-0000-0000-000000000001", filters: [] },
    results: [
      {
        id: "opt-rav4-hybrid",
        title: "RAV4 Hybrid",
        subtitle: "Compact hybrid SUV",
        availableCount: 12,
        nextSearchPlan: { searchId: "00000000-0000-0000-0000-000000000001", filters: [] },
        attributes: [
          {
            key: "colors",
            label: "Colors",
            options: [
              {
                value: "Gray",
                label: "Gray",
                metadata: { imageUrl: "/images/search/Ellipse 2392.svg" },
              },
            ],
          },
        ],
      },
    ],
  },
};

const turnCompleteWithTrimOptionCards: AgentSearchTurn = {
  ...turnCompleteWithOptionCards,
  response: {
    responseMode: "OptionCards",
    summary: "Trim-level options",
    totalCount: 1,
    optionLevel: "Trim",
    nextSearchPlan: { searchId: "00000000-0000-0000-0000-000000000001", filters: [] },
    results: [
      {
        id: "opt-le",
        title: "LE",
        subtitle: "Entry trim",
        availableCount: 8,
        nextSearchPlan: { searchId: "00000000-0000-0000-0000-000000000001", filters: [] },
        attributes: [
          { key: "year", label: "Year", value: "2024" },
          { key: "wheels", label: "Wheels", value: '17"' },
          { key: "display", label: "Display", value: '8"' },
        ],
      },
    ],
  },
};

// ─── Polyfills for jsdom ─────────────────────────────────────────────────────

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

// ─── Hook state control ───────────────────────────────────────────────────────

const defaultHookResult: UseAgentSearchTurnsResult = {
  turns: [],
  isLoading: false,
  isStreaming: false,
  submitTurn: vi.fn(),
  cancel: vi.fn(),
  markTurnAnimated: vi.fn(),
};

let currentHookResult: UseAgentSearchTurnsResult = defaultHookResult;

afterEach(() => {
  vi.restoreAllMocks();
  searchTurnsCollectionMocks.update.mockReset();
  currentHookResult = defaultHookResult;
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockParams = vi.hoisted(() => ({
  current: { id: "test-search-id" } as Record<string, string>,
}));

const searchTurnsCollectionMocks = vi.hoisted(() => ({
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => mockParams.current,
  usePathname: () => "/search/test-search-id",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../hooks/use-agent-search-turns", () => ({
  useAgentSearchTurns: () => currentHookResult,
}));

vi.mock("../hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => searchTurnsCollectionMocks,
}));

vi.mock("../hooks/use-auto-submit-turn-handler", () => ({
  useAutoSubmitTurnHandler: vi.fn().mockReturnValue("done"),
}));

vi.mock("../hooks/use-prefetch-filters", () => ({
  usePrefetchFilters: vi.fn(),
}));

vi.mock("../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

import { useAutoSubmitTurnHandler } from "../hooks/use-auto-submit-turn-handler";

const mockAutoSubmitHandler = vi.mocked(useAutoSubmitTurnHandler);

const mockContextValue = vi.hoisted(() => ({
  current: null as null | {
    hasSubmittedPrompt: boolean;
    isLoading: boolean;
    isNavigatedQuery: boolean;
    isQueryInitialized: boolean;
    lastQuery: string;
    searchConversationalState: string;
    showLocationPill: boolean;
    showSaveSearchToggle: boolean;
    setIsNavigatedQuery: ReturnType<typeof vi.fn>;
    setLastQuery: ReturnType<typeof vi.fn>;
    setSearchConversationalState: ReturnType<typeof vi.fn>;
  },
}));

vi.mock("../context/search-conversational-context", () => ({
  useSearchConversationalContext: () => mockContextValue.current,
}));

vi.mock("@features/landing/components/search-prompt/search-prompt-client", () => ({
  SearchPromptClient: ({
    onSubmit,
    placeholder,
    searchPreferences,
  }: {
    onSubmit: (q: string) => void;
    placeholder?: string | string[];
    searchPreferences?: {
      preferences?: string[];
    };
  }) => (
    <SearchPromptClientMock
      onSubmit={onSubmit}
      placeholder={placeholder}
      searchPreferences={searchPreferences}
    />
  ),
}));

vi.mock("../components/intent-banner", () => ({
  IntentBanner: ({
    actions,
    intentEyebrow,
    isLoading,
    response,
    beats,
  }: {
    actions?: Array<{ label: string; onClick?: () => void }>;
    beats?: Array<{ message: string; status: string }>;
    intentEyebrow?: string | { text: string; icon?: React.ReactNode };
    isLoading?: boolean;
    response?: ReactNode;
  }) => (
    <div data-testid="intent-banner">
      {intentEyebrow && (
        <span data-testid="eyebrow">
          {typeof intentEyebrow === "string" ? intentEyebrow : intentEyebrow.text}
        </span>
      )}
      {isLoading && <span data-testid="loading">Loading</span>}
      {response && <span data-testid="response">{response}</span>}
      {actions?.map((action) => (
        <button key={action.label} onClick={action.onClick} type="button">
          {action.label}
        </button>
      ))}
      {beats && beats.length > 0 && (
        <span data-testid="keywords">{beats.map((b) => b.message).join(",")}</span>
      )}
    </div>
  ),
}));

vi.mock("../lib/render-result-card", () => {
  const renderResultCard = (item: { type: string; id: string; data: Record<string, unknown> }) => {
    if (item.type === "model") {
      const data = item.data as { title: string; colors?: Array<{ label: string }> };
      return (
        <div data-testid="model-card">
          <span>{data.title}</span>
          {data.colors && data.colors.length > 0 && <span data-testid="model-colors">Colors</span>}
        </div>
      );
    }
    if (item.type === "inventory") {
      return <div data-testid="inventory-card">{(item.data as { model: string }).model}</div>;
    }
    if (item.type === "trim") {
      return <div data-testid="trim-card">{(item.data as { title: string }).title}</div>;
    }
    return <div data-testid="unknown-card" />;
  };

  return {
    renderResultCard,
    createResultCardRenderer: () => renderResultCard,
  };
});

vi.mock("@ucmp/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ucmp/ui")>();
  return {
    ...actual,
    Carousel: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="carousel">{children}</div>
    ),
    CarouselContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="carousel-content">{children}</div>
    ),
    CarouselItem: ({ children }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="carousel-item">{children}</div>
    ),
  };
});

function SearchPromptClientMock({
  onSubmit,
  placeholder,
  searchPreferences,
}: {
  onSubmit: (q: string) => void;
  placeholder?: string | string[];
  searchPreferences?: {
    preferences?: string[];
  };
}) {
  const [value, setValue] = useState("");
  return (
    <div data-testid="search-prompt">
      <span
        data-has-search-preferences={searchPreferences ? "true" : "false"}
        data-testid="search-preferences-meta"
      >
        {searchPreferences?.preferences?.length ?? 0}
      </span>
      <input
        aria-label="search"
        data-placeholder={Array.isArray(placeholder) ? placeholder[0] : placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit(value);
          }
        }}
        value={value}
      />
    </div>
  );
}

// Import after mocks are set up
import { SearchResultsOrchestrator } from "../components/search-results-orchestrator/search-results-orchestrator";

// ─── Constants ───────────────────────────────────────────────────────────────

const SEARCH_INPUT_REGEX = /search/i;
const INVENTORY_TOYOTA_MODEL = /2024 Toyota Highlander Hybrid/;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SearchResultsOrchestrator", () => {
  // ─── Empty state ──────────────────────────────────────────────────────────

  describe("Empty state (no turns)", () => {
    it("renders the search prompt", () => {
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("search-prompt")).toBeInTheDocument();
    });

    it("does not render an IntentBanner when there are no turns", () => {
      render(<SearchResultsOrchestrator />);
      expect(screen.queryByTestId("intent-banner")).not.toBeInTheDocument();
    });

    it("does not render cards when there are no turns", () => {
      render(<SearchResultsOrchestrator />);
      expect(screen.queryByTestId("model-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("inventory-card")).not.toBeInTheDocument();
    });
  });

  // ─── Pending / streaming turn ─────────────────────────────────────────────

  describe("Pending turn", () => {
    it("renders the IntentBanner with the query as eyebrow", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnPending], isStreaming: true };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("eyebrow")).toHaveTextContent(turnPending.query ?? "");
    });

    it("shows the loading indicator", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnPending], isStreaming: true };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });

    it("does not show a response text while pending", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnPending], isStreaming: true };
      render(<SearchResultsOrchestrator />);
      expect(screen.queryByTestId("response")).not.toBeInTheDocument();
    });
  });

  describe("Streaming turn", () => {
    it("shows loading state while streaming", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnStreaming], isStreaming: true };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.queryByTestId("response")).not.toBeInTheDocument();
    });

    it("shows cards immediately when a turn seen streaming in-session completes", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnStreaming], isStreaming: true };

      const { rerender } = render(<SearchResultsOrchestrator />);
      expect(screen.queryByTestId("model-card")).not.toBeInTheDocument();

      currentHookResult = {
        ...defaultHookResult,
        isStreaming: false,
        turns: [
          {
            ...turnCompleteWithOptionCards,
            id: turnStreaming.id,
            query: turnStreaming.query,
          },
        ],
      };

      rerender(<SearchResultsOrchestrator />);

      expect(screen.getAllByTestId("model-card").length).toBeGreaterThan(0);
      expect(screen.getByTestId("response")).toHaveTextContent(
        turnCompleteWithOptionCards.response?.summary ?? ""
      );
    });
  });

  // ─── Completed turn ───────────────────────────────────────────────────────

  describe("Completed turn with OptionCards", () => {
    it("renders the query as eyebrow", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithOptionCards] };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("eyebrow")).toHaveTextContent(
        turnCompleteWithOptionCards.query ?? ""
      );
    });

    it("renders the summary as response text", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithOptionCards] };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("response")).toHaveTextContent(
        turnCompleteWithOptionCards.response?.summary ?? ""
      );
    });

    it("renders model cards for OptionCard results", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithOptionCards] };
      render(<SearchResultsOrchestrator />);
      const cards = screen.getAllByTestId("model-card");
      const response = turnCompleteWithOptionCards.response;
      const expectedCount = response && "results" in response ? response.results.length : 0;
      // Cards appear in both mobile and desktop panels for the last turn
      expect(cards.length).toBeGreaterThanOrEqual(expectedCount);
    });

    it("renders color swatches for model OptionCards", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithModelColors] };
      render(<SearchResultsOrchestrator />);
      expect(screen.getAllByTestId("model-colors").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Completed turn with Trim OptionCards", () => {
    it("renders trim cards for Trim OptionCard results", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTrimOptionCards] };
      render(<SearchResultsOrchestrator />);
      const cards = screen.getAllByTestId("trim-card");
      const response = turnCompleteWithTrimOptionCards.response;
      const expectedCount = response && "results" in response ? response.results.length : 0;
      expect(cards.length).toBeGreaterThanOrEqual(expectedCount);
    });
  });

  describe("Completed turn with InventoryCards", () => {
    it("renders inventory cards", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithInventoryCards] };
      render(<SearchResultsOrchestrator />);
      const cards = screen.getAllByTestId("inventory-card");
      const response = turnCompleteWithInventoryCards.response;
      const expectedCount = response && "results" in response ? response.results.length : 0;
      expect(cards.length).toBeGreaterThanOrEqual(expectedCount);
    });

    it("renders the correct model names", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithInventoryCards] };
      render(<SearchResultsOrchestrator />);
      expect(screen.getAllByText("Tacoma").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Tundra").length).toBeGreaterThanOrEqual(1);
    });

    it("renders InventoryResultsGrid when turn has 8 inventory cards", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWith8InventoryCards] };
      render(<SearchResultsOrchestrator />);
      // Carousel is rendered with the grid
      const carousels = screen.getAllByTestId("carousel");
      expect(carousels.length).toBeGreaterThan(0);
      // Verify at least one inventory card is visible (grid renders via carousel)
      expect(screen.getAllByAltText(INVENTORY_TOYOTA_MODEL).length).toBeGreaterThan(0);
    });

    it("renders InventoryResultsGrid when turn has 6 inventory cards", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWith6InventoryCards] };
      render(<SearchResultsOrchestrator />);
      // Carousel is rendered with the grid
      const carousels = screen.getAllByTestId("carousel");
      expect(carousels.length).toBeGreaterThan(0);
      // Verify at least one inventory card is visible (grid renders via carousel)
      expect(screen.getAllByAltText(INVENTORY_TOYOTA_MODEL).length).toBeGreaterThan(0);
    });

    it("renders CardCarousel when inventory response has 2–5 cards (no grid)", () => {
      // turnCompleteWithInventoryCards has 2 cards, so carousel should render (not grid)
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithInventoryCards] };
      render(<SearchResultsOrchestrator />);
      // Carousel will be rendered for 2-card response
      const carousels = screen.getAllByTestId("carousel");
      expect(carousels.length).toBeGreaterThan(0);
      // Verify the carousel is rendered and contains truck-related content
      expect(screen.getAllByText("Tacoma").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Tundra").length).toBeGreaterThan(0);
    });

    it("renders See all results button with 8-card inventory grid", () => {
      // Add nextSearchPlan to response for button rendering
      const inventoryResponse = turnCompleteWith8InventoryCards.response;
      expect(inventoryResponse?.responseMode).toBe("InventoryCards");

      type InventoryCardsResponse = Extract<
        AgentSearchResponse,
        { responseMode: "InventoryCards" }
      >;

      const turnWith8Cards: AgentSearchTurn = {
        ...turnCompleteWith8InventoryCards,
        response: {
          ...(inventoryResponse as InventoryCardsResponse),
          nextSearchPlan: {
            searchId: "00000000-0000-0000-0000-000000000099",
            filters: [],
          },
        },
      };
      currentHookResult = { ...defaultHookResult, turns: [turnWith8Cards] };
      render(<SearchResultsOrchestrator />);
      // See all results button should render for inventory cards with nextSearchPlan
      const buttons = screen.getAllByText("See all results");
      expect(buttons.length).toBeGreaterThan(0);
      // Verify href is derived from nextSearchPlan.searchId
      const hrefs = buttons.map((button) => button.closest("a")?.getAttribute("href"));
      expect(hrefs).toContain("/search/00000000-0000-0000-0000-000000000099/results");
    });
  });

  // ─── Completed turn with no cards (conversational response) ──────────────────

  describe("Completed turn with no cards", () => {
    it("renders the summary text", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTextOnly] };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("response")).toHaveTextContent(
        "I'm sorry to hear that. Do you want to tell me where we've fallen short in the past?"
      );
    });

    describe("Errored turn", () => {
      it("renders the friendly recovery row without cards or diagnostics", () => {
        currentHookResult = { ...defaultHookResult, turns: [turnError] };
        render(<SearchResultsOrchestrator />);

        expect(screen.getByTestId("eyebrow")).toHaveTextContent(turnError.query ?? "");
        expect(screen.getByTestId("response")).toHaveTextContent(
          "I wasn't able to complete your search. Try a different question?"
        );
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
        expect(screen.queryByText(turnError.errorCode ?? "")).not.toBeInTheDocument();
        expect(screen.queryByText(turnError.errorMessage ?? "")).not.toBeInTheDocument();
        expect(screen.queryByTestId("model-card")).not.toBeInTheDocument();
        expect(screen.queryByTestId("inventory-card")).not.toBeInTheDocument();
      });

      it("submits the original query when retry is activated", async () => {
        const submitTurn = vi.fn();
        currentHookResult = { ...defaultHookResult, submitTurn, turns: [turnError] };
        render(<SearchResultsOrchestrator />);

        await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

        expect(submitTurn).toHaveBeenCalledWith(
          expect.objectContaining({ query: turnError.query, source: "query" })
        );
      });

      it("supports keyboard activation with the same retry behavior", async () => {
        const submitTurn = vi.fn();
        currentHookResult = { ...defaultHookResult, submitTurn, turns: [turnError] };
        render(<SearchResultsOrchestrator />);

        const retry = screen.getByRole("button", { name: "Try again" });
        retry.focus();
        await userEvent.setup().keyboard("{Enter}");

        expect(submitTurn).toHaveBeenCalledWith(
          expect.objectContaining({ query: turnError.query, source: "query" })
        );
      });

      it("keeps queryless errors visible without a retry action", () => {
        currentHookResult = {
          ...defaultHookResult,
          turns: [{ ...turnError, query: undefined, label: "Vehicle search" }],
        };
        render(<SearchResultsOrchestrator />);

        expect(screen.getByTestId("response")).toHaveTextContent(
          "I wasn't able to complete your search. Try a different question?"
        );
        expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
      });

      it("keeps a historical error row visible beside a later independent row", () => {
        currentHookResult = {
          ...defaultHookResult,
          turns: [turnError, turnCompleteWithTextOnly],
        };
        render(<SearchResultsOrchestrator />);

        expect(screen.getAllByTestId("intent-banner")).toHaveLength(2);
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
        expect(
          screen.getByText(turnCompleteWithTextOnly.response?.summary ?? "")
        ).toBeInTheDocument();
      });
    });

    it("does not render any cards", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTextOnly] };
      render(<SearchResultsOrchestrator />);
      expect(screen.queryByTestId("model-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("inventory-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("comparison-card")).not.toBeInTheDocument();
    });

    it("does not render a 'See all results' link", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTextOnly] };
      render(<SearchResultsOrchestrator />);
      expect(screen.queryByText("See all results")).not.toBeInTheDocument();
    });

    it("uses full-width layout (col-span-12) with no card column", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTextOnly] };
      const { container } = render(<SearchResultsOrchestrator />);
      // A card-less active turn spans the full grid (nested reveal grid), with
      // no desktop card column.
      const scrollArea = container.querySelector("[class*='overflow-y-auto']");
      expect(scrollArea).not.toBeNull();
      expect(scrollArea?.querySelector("[class*='lg:col-span-12']")).toBeInTheDocument();
      expect(scrollArea?.querySelector("[class*='lg:col-span-7']")).not.toBeInTheDocument();
      expect(scrollArea?.querySelector("[class*='lg:col-span-6']")).not.toBeInTheDocument();
    });
  });

  // ─── Multi-turn thread ────────────────────────────────────────────────────

  describe("Multi-turn thread", () => {
    it("renders one IntentBanner per turn", () => {
      currentHookResult = {
        ...defaultHookResult,
        turns: [turnCompleteWithOptionCards, turnCompleteWithInventoryCards],
      };
      render(<SearchResultsOrchestrator />);
      expect(screen.getAllByTestId("intent-banner").length).toBe(2);
    });

    it("renders each turn's query as eyebrow", () => {
      currentHookResult = {
        ...defaultHookResult,
        turns: [turnCompleteWithOptionCards, turnCompleteWithInventoryCards],
      };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByText(turnCompleteWithOptionCards.query ?? "")).toBeInTheDocument();
      expect(screen.getByText(turnCompleteWithInventoryCards.query ?? "")).toBeInTheDocument();
    });
  });

  // ─── Search Prompt ────────────────────────────────────────────────────────

  describe("Search Prompt", () => {
    it("passes placeholder prop to SearchPromptClient", () => {
      render(<SearchResultsOrchestrator placeholder={placeholderString} />);
      const input = screen.getByRole("textbox", { name: SEARCH_INPUT_REGEX });
      expect(input).toHaveAttribute("data-placeholder", placeholderString);
    });

    it("passes array placeholder to SearchPromptClient", () => {
      render(<SearchResultsOrchestrator placeholder={placeholderArray} />);
      const input = screen.getByRole("textbox", { name: SEARCH_INPUT_REGEX });
      expect(input).toHaveAttribute("data-placeholder", placeholderArray[0]);
    });

    it("calls submitTurn when the user submits a query", async () => {
      const submitTurn = vi.fn();
      currentHookResult = { ...defaultHookResult, submitTurn };
      render(<SearchResultsOrchestrator />);
      const user = userEvent.setup();
      const input = screen.getByRole("textbox", { name: SEARCH_INPUT_REGEX });
      await user.type(input, "hybrid SUV");
      await user.keyboard("{Enter}");
      expect(submitTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "hybrid SUV",
          location: expect.objectContaining({ zipCode: expect.any(String) }),
        })
      );
    });
  });

  // ─── Layout structure ─────────────────────────────────────────────────────

  describe("Layout structure", () => {
    it("renders a scrollable thread container", () => {
      const { container } = render(<SearchResultsOrchestrator />);
      expect(container.querySelector("[class*='overflow-y-auto']")).toBeInTheDocument();
    });

    it("renders the search prompt container", () => {
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("search-prompt")).toBeInTheDocument();
    });

    it("renders the right panel on desktop when a complete turn has cards", () => {
      vi.useFakeTimers();
      try {
        currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithOptionCards] };
        const { container } = render(<SearchResultsOrchestrator />);
        // The first active turn reveals its cards after the centered→two-column
        // animation delay; advance past it so the desktop card column mounts.
        act(() => {
          vi.advanceTimersByTime(1100);
        });
        expect(container.querySelector("[class*='lg:col-span-8']")).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe("Accessibility", () => {
    it("renders a keyboard-accessible search input", () => {
      render(<SearchResultsOrchestrator />);
      const input = screen.getByRole("textbox", { name: SEARCH_INPUT_REGEX });
      expect(input).toBeInTheDocument();
    });

    it("exposes search preferences metadata to the search prompt", () => {
      render(<SearchResultsOrchestrator />);
      const meta = screen.getByTestId("search-preferences-meta");
      expect(meta).toHaveAttribute("data-has-search-preferences", "true");
      // Preferences count is 0 when there are no completed turns with nextSearchPlan.filters
      expect(meta).toHaveTextContent("0");
    });
  });

  // ─── Auto-submit gate ──────────────────────────────────────────────────────

  describe("Auto-submit gate", () => {
    it("shows skeleton while handler is loading", () => {
      mockAutoSubmitHandler.mockReturnValue("loading");
      const { container } = render(<SearchResultsOrchestrator />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows skeleton while handler is submitting", () => {
      mockAutoSubmitHandler.mockReturnValue("submitting");
      const { container } = render(<SearchResultsOrchestrator />);
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not show skeleton once handler is done", () => {
      mockAutoSubmitHandler.mockReturnValue("done");
      currentHookResult = {
        ...defaultHookResult,
        turns: [turnCompleteWithInventoryCards],
      };
      render(<SearchResultsOrchestrator />);
      expect(screen.getByTestId("intent-banner")).toBeInTheDocument();
    });
  });

  // ─── Reusable props (searchId, onEmpty, hidePreferences, header) ──────────

  describe("Reusable props", () => {
    it("renders the header slot above the thread", () => {
      currentHookResult = { ...defaultHookResult, turns: [turnCompleteWithTextOnly] };
      render(
        <SearchResultsOrchestrator header={<div data-testid="custom-header">Vehicle Info</div>} />
      );
      expect(screen.getByTestId("custom-header")).toBeInTheDocument();
      expect(screen.getByText("Vehicle Info")).toBeInTheDocument();
    });

    it("does not render search preferences when hidePreferences is true", () => {
      render(<SearchResultsOrchestrator hidePreferences />);
      const meta = screen.getByTestId("search-preferences-meta");
      expect(meta).toHaveAttribute("data-has-search-preferences", "false");
    });

    it("renders search preferences when hidePreferences is not set", () => {
      render(<SearchResultsOrchestrator />);
      const meta = screen.getByTestId("search-preferences-meta");
      expect(meta).toHaveAttribute("data-has-search-preferences", "true");
    });

    it("passes searchId prop to useAutoSubmitTurnHandler", () => {
      render(<SearchResultsOrchestrator searchId="custom-search-id" />);
      expect(mockAutoSubmitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ searchId: "custom-search-id" })
      );
    });

    it("uses route param when searchId prop is not provided", () => {
      render(<SearchResultsOrchestrator />);
      expect(mockAutoSubmitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ searchId: "test-search-id" })
      );
    });

    it("skips auto-submit handler when initialQuery is provided", () => {
      render(<SearchResultsOrchestrator initialQuery="How much cargo space?" />);
      expect(mockAutoSubmitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ searchId: "skip-auto-submit" })
      );
    });
  });
});
