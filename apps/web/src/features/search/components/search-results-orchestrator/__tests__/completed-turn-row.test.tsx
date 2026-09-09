/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AgentSearchTurn } from "../../../lib/agent-search-turns-collection";

// ─── Polyfills for jsdom ─────────────────────────────────────────────────────

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-search-id" }),
  usePathname: () => "/search/test-search-id",
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: any) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock("../../../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const turnWithActions: AgentSearchTurn = {
  id: "turn-001",
  query: "How does Limited compare to XLE?",
  response: {
    actions: [
      { href: "/search", label: "What makes this one better?" },
      { href: "/search/xle", label: "Show me XLE inventory" },
    ],
    optionLevel: "Fallback",
    responseMode: "OptionCards",
    results: [],
    summary: "The Limited is a step up from the XLE with premium features.",
    totalCount: 0,
    nextSearchPlan: { searchId: "00000000-0000-0000-0000-000000000001", filters: [] },
  },
  role: "user",
  searchId: "search-001",
  status: "complete",
  submittedAt: Date.now(),
};

const turnWithCards: AgentSearchTurn = {
  id: "turn-002",
  query: "Show me SUVs",
  response: {
    nextSearchPlan: { filters: [], searchId: "search-001" },
    responseMode: "InventoryCards",
    results: [
      {
        dealerInfo: { dealerCode: "5012", dealerName: "Test Dealer", zipCode: "90210" },
        media: { primaryImageUrl: "/inventory-card/inventory-card1.png" },
        pricing: { listPrice: 32_000, msrp: 32_000, sellingPrice: 32_000 },
        status: { mileage: 0, vehicleStatus: "In Stock" },
        vehicleInfo: {
          make: "Toyota",
          model: "RAV4",
          trim: "XLE",
          year: 2026,
        },
        vin: "vin-rav4-001",
      },
    ],
    summary: "Here are some SUV options.",
    totalCount: 1,
  },
  role: "user",
  searchId: "search-001",
  status: "complete",
  submittedAt: Date.now(),
};

// ─── Import after mocks ──────────────────────────────────────────────────────

import { CompletedTurnRow } from "../completed-turn-row";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CompletedTurnRow — scroll layout classes", () => {
  it("applies lg:h-full, lg:min-h-0, and lg:overflow-y-auto to the conversation column", () => {
    const submitTurn = vi.fn();

    const { container } = render(
      <CompletedTurnRow submitTurn={submitTurn} turn={turnWithActions} />
    );

    const conversationCol = container.querySelector(".lg\\:overflow-y-auto");
    expect(conversationCol).toBeInTheDocument();
    expect(conversationCol).toHaveClass("lg:h-full");
    expect(conversationCol).toHaveClass("lg:min-h-0");
  });
});

describe("CompletedTurnRow — readOnly mode", () => {
  describe("when readOnly is true", () => {
    it("renders action buttons that call submitTurn with the label as query", async () => {
      const submitTurn = vi.fn();
      const user = userEvent.setup();

      render(<CompletedTurnRow readOnly submitTurn={submitTurn} turn={turnWithActions} />);

      const actionButton = screen.getByText("What makes this one better?");
      await user.click(actionButton);

      expect(submitTurn).toHaveBeenCalledWith({
        location: expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          zipCode: expect.any(String),
        }),
        query: "What makes this one better?",
        source: "query",
      });
    });

    it("does not render actions as links (no <a> elements for actions)", () => {
      const submitTurn = vi.fn();

      render(<CompletedTurnRow readOnly submitTurn={submitTurn} turn={turnWithActions} />);

      const actionButton = screen.getByText("What makes this one better?");
      // The action should be a button, not wrapped in a link
      expect(actionButton.closest("a")).toBeNull();
    });

    it("does not render 'See all results' button", () => {
      const submitTurn = vi.fn();

      render(<CompletedTurnRow readOnly submitTurn={submitTurn} turn={turnWithCards} />);

      expect(screen.queryByText("See all results")).not.toBeInTheDocument();
    });

    it("uses the renderItem prop for card rendering when provided", () => {
      const submitTurn = vi.fn();
      const mockRenderItem = vi.fn(() => <div data-testid="custom-card">Custom</div>);

      render(
        <CompletedTurnRow
          readOnly
          renderItem={mockRenderItem}
          submitTurn={submitTurn}
          turn={turnWithCards}
        />
      );

      expect(mockRenderItem).toHaveBeenCalled();
      expect(screen.getAllByTestId("custom-card").length).toBeGreaterThan(0);
    });
  });

  describe("when readOnly is false (default)", () => {
    it("renders actions as links when they have hrefs", () => {
      const submitTurn = vi.fn();

      render(<CompletedTurnRow submitTurn={submitTurn} turn={turnWithActions} />);

      const actionLink = screen.getByText("What makes this one better?").closest("a");
      expect(actionLink).not.toBeNull();
      expect(actionLink).toHaveAttribute("href", "/search");
    });

    it("does not call submitTurn when action link is clicked", async () => {
      const submitTurn = vi.fn();
      const user = userEvent.setup();

      render(<CompletedTurnRow submitTurn={submitTurn} turn={turnWithActions} />);

      const actionLink = screen.getByText("What makes this one better?");
      await user.click(actionLink);

      // In non-readOnly mode, actions are links — submitTurn is not called
      expect(submitTurn).not.toHaveBeenCalled();
    });

    it("does not render 'See all results' button", () => {
      const submitTurn = vi.fn();

      render(<CompletedTurnRow submitTurn={submitTurn} turn={turnWithCards} />);

      expect(screen.queryByText("See all results")).not.toBeInTheDocument();
    });
  });
});
