/// <reference types="@testing-library/jest-dom" />

import { act, render, screen, waitFor } from "@ucmp/vitest-config/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mock context value control ──────────────────────────────────────────────

const mockContextValue = vi.hoisted(() => ({
  current: null as null | {
    hasSubmittedPrompt: boolean;
    isLoading: boolean;
    searchConversationalState: string;
    setSearchConversationalState: ReturnType<typeof vi.fn>;
  },
}));
const mockPromptProps = vi.hoisted(() => ({
  current: [] as Array<{
    error?: string;
    onErrorDismiss?: () => void;
    onSubmit?: (query: string) => void;
  }>,
}));
const mockSubmitHandlerProps = vi.hoisted(() => ({
  current: null as null | { onError?: () => void },
}));

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@features/search/context/search-conversational-context", () => ({
  useSearchConversationalContext: () => mockContextValue.current,
}));

vi.mock("@features/search/hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => ({ update: vi.fn(), insert: vi.fn() }),
}));

vi.mock("@features/search/services/agent-search-service", () => ({
  submitAgentTurn: vi.fn().mockResolvedValue(undefined),
  SearchNotFoundError: class SearchNotFoundError extends Error {
    readonly searchId: string;
    readonly turnId: string;
    constructor(searchId: string, turnId: string) {
      super(`Search not found: ${searchId}`);
      this.name = "SearchNotFoundError";
      this.searchId = searchId;
      this.turnId = turnId;
    }
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@features/landing/components/search-prompt/search-prompt-client", () => ({
  SearchPromptClient: (props: { error?: string; onErrorDismiss?: () => void }) => {
    mockPromptProps.current.push(props);
    return <input data-testid="search-prompt" />;
  },
}));

vi.mock("@features/landing/components/hero-section/hero-section", () => ({
  HeroSection: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <section className={className} data-testid="hero-section">
      {children}
    </section>
  ),
}));

vi.mock("@features/search", () => ({
  MOCK_PROMPT_SUGGESTIONS: [],
  MOCK_PROMPT_SUGGESTIONS_RETURNING: [],
  PromptSuggestionList: () => <div data-testid="suggestion-list" />,
  SEARCH_HERO_CONTENT: { subheadline: "Test subheadline" },
  SearchLoadingContent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="transition-content">{children}</div>
  ),
  searchSuggestionService: vi.fn(),
  useIsReturningUser: vi.fn(() => false),
}));

vi.mock("@features/search/data/mock-prompt-suggestions-returning", () => ({
  MOCK_PROMPT_SUGGESTIONS_RETURNING: [],
}));

vi.mock("@features/search/hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

vi.mock("@features/search/data/suggestion-ui-config", () => ({
  getSuggestionUIConfig: () => ({
    sectionLabel: "Suggestions",
    ariaLabel: "Search suggestions",
  }),
}));

vi.mock("../components/search-conversational-controller/search-submit-handler-wrapper", () => ({
  SearchSubmitHandlerWrapper: (props: { onError?: () => void }) => {
    mockSubmitHandlerProps.current = props;
    return <div data-testid="submit-handler" />;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { SearchConversationalController } from "../components/search-conversational-controller/search-conversational-controller";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setContext(overrides: Partial<NonNullable<typeof mockContextValue.current>> = {}) {
  mockContextValue.current = {
    hasSubmittedPrompt: false,
    isLoading: false,
    searchConversationalState: "idle",
    setSearchConversationalState: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  mockContextValue.current = null;
  mockPromptProps.current = [];
  mockSubmitHandlerProps.current = null;
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SearchConversationalController — hero section visibility", () => {
  it("renders the hero section in idle state", () => {
    setContext({ searchConversationalState: "idle" });
    render(<SearchConversationalController />);

    const hero = screen.getByTestId("hero-section");
    expect(hero.className).not.toContain("hidden");
  });

  it("hides hero section on mobile when typing (adds 'hidden' class)", () => {
    setContext({ searchConversationalState: "typing" });
    render(<SearchConversationalController />);

    const hero = screen.getByTestId("hero-section");
    expect(hero.className).toContain("hidden");
  });

  it("keeps hero visible on desktop when typing (adds 'lg:flex')", () => {
    setContext({ searchConversationalState: "typing" });
    render(<SearchConversationalController />);

    const hero = screen.getByTestId("hero-section");
    expect(hero.className).toContain("lg:flex");
  });

  it("hides hero section completely after submission (all breakpoints)", () => {
    setContext({ hasSubmittedPrompt: true, searchConversationalState: "loading" });
    render(<SearchConversationalController />);

    expect(screen.queryByTestId("hero-section")).not.toBeInTheDocument();
  });

  it("does not render hero section with aria-hidden when submission is complete", () => {
    setContext({ hasSubmittedPrompt: true, searchConversationalState: "loading" });
    render(<SearchConversationalController />);

    expect(screen.queryByTestId("hero-section")).toBeNull();
  });

  it("hero section is visible when in focused state (no hide)", () => {
    setContext({ searchConversationalState: "focused" });
    render(<SearchConversationalController />);

    const hero = screen.getByTestId("hero-section");
    expect(hero.className).not.toContain("hidden");
  });

  it("hides desktop search prompt after submission", () => {
    setContext({ hasSubmittedPrompt: true, searchConversationalState: "loading" });
    const { container } = render(<SearchConversationalController />);

    const promptWrapper = container.querySelector("[style*='view-transition-name']");
    expect(promptWrapper).toBeNull();
  });
});

describe("SearchConversationalController — UI rendering", () => {
  it("renders suggestion list component", () => {
    setContext({ searchConversationalState: "idle" });
    render(<SearchConversationalController />);

    const suggestionList = screen.getByTestId("suggestion-list");
    expect(suggestionList).toBeInTheDocument();
  });

  it("renders search prompt client component", () => {
    setContext({ searchConversationalState: "idle" });
    render(<SearchConversationalController />);

    const searchPrompts = screen.getAllByTestId("search-prompt");
    expect(searchPrompts.length).toBeGreaterThan(0);
  });

  it("wires shared error and dismiss props to desktop and mobile prompts", () => {
    setContext({ searchConversationalState: "idle" });
    render(<SearchConversationalController />);

    expect(mockPromptProps.current).toHaveLength(2);
    for (const props of mockPromptProps.current) {
      expect(props.error).toBeUndefined();
      expect(props.onErrorDismiss).toEqual(expect.any(Function));
    }
  });

  it("restores the prompt with the shared error after an initial turn fails", async () => {
    setContext({ searchConversationalState: "idle" });
    render(<SearchConversationalController />);

    act(() => {
      mockPromptProps.current[0]?.onSubmit?.("cargo");
    });

    await waitFor(() => {
      expect(mockSubmitHandlerProps.current?.onError).toEqual(expect.any(Function));
    });

    act(() => {
      mockSubmitHandlerProps.current?.onError?.();
    });

    await waitFor(() => {
      expect(
        mockPromptProps.current.some(
          (props) =>
            props.error === "I wasn't able to complete your search. Try a different question?"
        )
      ).toBe(true);
    });
  });

  it("shows transition content when in loading state", () => {
    setContext({
      hasSubmittedPrompt: true,
      searchConversationalState: "loading",
      isLoading: true,
    });
    render(<SearchConversationalController />);

    const transitionContent = screen.getByTestId("transition-content");
    expect(transitionContent).toBeInTheDocument();
  });
});
