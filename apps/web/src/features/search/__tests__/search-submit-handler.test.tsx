/// <reference types="@testing-library/jest-dom" />

import { render, waitFor } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.hoisted(() => vi.fn());
const mockSetSearchConversationalState = vi.hoisted(() => vi.fn());

let liveTurnsData: Array<{ id: string; status: "pending" | "streaming" | "complete" | "error" }> =
  [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@features/search/context/search-conversational-context", () => ({
  useSearchConversationalContext: () => ({
    setSearchConversationalState: mockSetSearchConversationalState,
  }),
}));

vi.mock("@features/search/hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => ({}),
}));

vi.mock("@features/search/components/search-loading-indicator", () => ({
  SearchLoadingIndicator: () => <div data-testid="search-transition" />,
}));

vi.mock("@tanstack/react-db", () => ({
  eq: vi.fn(),
  useLiveQuery: () => ({ data: liveTurnsData }),
}));

import { SearchSubmitHandler } from "../components/search-conversational-controller/search-submit-handler";

describe("SearchSubmitHandler", () => {
  beforeEach(() => {
    liveTurnsData = [];
    mockPush.mockReset();
    mockSetSearchConversationalState.mockReset();
  });

  it("navigates when turn is settled and canNavigate is true", async () => {
    liveTurnsData = [{ id: "turn-1", status: "complete" }];

    render(
      <SearchSubmitHandler canNavigate query="RAV4 Hybrid" searchId="search-123" turnId="turn-1" />
    );

    await waitFor(() => {
      expect(mockSetSearchConversationalState).toHaveBeenCalledWith("results-generated");
      expect(mockPush).toHaveBeenCalledWith("/search/search-123");
    });
  });

  it("returns to typing and invokes onError when an error turn is settled", async () => {
    liveTurnsData = [{ id: "turn-1", status: "error" }];
    const onError = vi.fn();

    render(
      <SearchSubmitHandler
        canNavigate
        onError={onError}
        query="RAV4 Hybrid"
        searchId="search-123"
        turnId="turn-1"
      />
    );

    await waitFor(() => {
      expect(mockSetSearchConversationalState).toHaveBeenCalledWith("typing");
      expect(onError).toHaveBeenCalledOnce();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("does not navigate when canNavigate is false even if turn is settled", async () => {
    liveTurnsData = [{ id: "turn-1", status: "complete" }];

    render(
      <SearchSubmitHandler
        canNavigate={false}
        query="RAV4 Hybrid"
        searchId="search-123"
        turnId="turn-1"
      />
    );

    await waitFor(() => {
      expect(mockSetSearchConversationalState).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("does not navigate when turn is not settled", async () => {
    liveTurnsData = [{ id: "turn-1", status: "pending" }];

    render(<SearchSubmitHandler query="RAV4 Hybrid" searchId="search-123" turnId="turn-1" />);

    await waitFor(() => {
      expect(mockSetSearchConversationalState).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
