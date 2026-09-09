/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { AgentSearchTurn } from "../../../lib/agent-search-turns-collection";

vi.mock("../../../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

import { TurnConversation } from "../turn-conversation";

const errorTurn: AgentSearchTurn = {
  errorCode: "SearchToolTimeout",
  errorMessage: "The search tool timed out.",
  id: "turn-error",
  query: "Find an electric SUV",
  role: "user",
  searchId: "search-1",
  status: "error",
  submittedAt: 1,
};

describe("TurnConversation error state", () => {
  it("renders friendly copy and a real IntentBanner retry button", async () => {
    const submitTurn = vi.fn();
    const user = userEvent.setup();

    render(<TurnConversation submitTurn={submitTurn} turn={errorTurn} />);

    expect(screen.getByRole("region", { name: "Intent banner" })).toBeInTheDocument();
    expect(screen.getByText("Find an electric SUV")).toBeInTheDocument();
    expect(
      screen.getByText("I wasn't able to complete your search. Try a different question?")
    ).toBeInTheDocument();
    expect(screen.queryByText(errorTurn.errorCode ?? "")).not.toBeInTheDocument();
    expect(screen.queryByText(errorTurn.errorMessage ?? "")).not.toBeInTheDocument();

    const retry = screen.getByRole("button", { name: "Try again" });
    retry.focus();
    await user.keyboard("{Enter}");

    expect(submitTurn).toHaveBeenCalledWith({
      query: errorTurn.query,
      location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
      source: "query",
    });
  });
});
