import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { NextSearchPlan } from "../lib/agent-search-turns-collection";
import { createResultCardRenderer } from "../lib/render-result-card";
import type { SearchResultItem } from "../types/search-results";

// ─── Mocks — Card components ─────────────────────────────────────────────────

vi.mock("@shared/components/model-card", () => ({
  ButtonModelCard: ({ buttonProps }: { buttonProps: { onClick?: () => void } }) => (
    <button data-testid="button-model-card" onClick={buttonProps.onClick} type="button">
      Model
    </button>
  ),
  ModelCardContent: () => <div data-testid="static-model-card">Model (static)</div>,
  ModelCardContentProps: {},
}));

vi.mock("@shared/components/comparison-card", () => ({
  ButtonComparisonCard: ({ buttonProps }: { buttonProps: { onClick?: () => void } }) => (
    <button data-testid="button-comparison-card" onClick={buttonProps.onClick} type="button">
      Comparison
    </button>
  ),
  ComparisonCardContent: () => <div data-testid="static-comparison-card">Comparison (static)</div>,
  ComparisonCardContentProps: {},
}));

vi.mock("@shared/components/trim-card", () => ({
  ButtonTrimCard: ({ buttonProps }: { buttonProps: { onClick?: () => void } }) => (
    <button data-testid="button-trim-card" onClick={buttonProps.onClick} type="button">
      Trim
    </button>
  ),
  TrimCardContent: () => <div data-testid="static-trim-card">Trim (static)</div>,
}));

vi.mock("@shared/components/editorial-card", () => ({
  ButtonEditorialCard: ({ buttonProps }: { buttonProps: { onClick?: () => void } }) => (
    <button data-testid="button-editorial-card" onClick={buttonProps.onClick} type="button">
      Editorial (button)
    </button>
  ),
  LinkEditorialCard: () => (
    <a data-testid="link-editorial-card" href="/editorial">
      Editorial (link)
    </a>
  ),
  StaticEditorialCard: () => <div data-testid="static-editorial-card">Editorial (static)</div>,
  EditorialCardData: {},
}));

vi.mock("@shared/components/inventory-card", () => ({
  LinkInventoryCard: () => (
    <a data-testid="link-inventory-card" href="/vdp">
      Inventory
    </a>
  ),
  LinkInventoryCardClient: ({ activitySource }: { activitySource?: string }) => (
    <a data-activity-source={activitySource} data-testid="link-inventory-card" href="/vdp">
      Inventory
    </a>
  ),
  InventoryCardContent: () => <div data-testid="static-inventory-card">Inventory (static)</div>,
  SIZE_TOKEN: { large: "large" },
}));

vi.mock("@shared/components/card", () => ({
  CARD_SIZE: { search: "w-112", large: "w-80" },
  StaticCard: ({
    children,
    wrapperClassName,
    ...props
  }: {
    children: React.ReactNode;
    wrapperClassName?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid="static-card" {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@features/landing/components/dealer-offer/dealer-offer-card", () => ({
  DealerOfferCard: () => <div data-testid="dealer-offer-card">Dealer Offer</div>,
}));

vi.mock("@ucmp/ui/icons", () => ({
  IconBinocular: () => <svg data-testid="icon-binocular" />,
  IconBolt: () => <svg data-testid="icon-bolt" />,
  IconLocation: () => <svg data-testid="icon-location" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN: NextSearchPlan = {
  searchId: "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789",
  filters: [{ key: "make", values: ["Toyota"] }],
  location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
};

function modelItem(plan?: NextSearchPlan): SearchResultItem {
  return {
    type: "model",
    id: "model-1",
    data: { title: "RAV4", image: { src: "/img.png", alt: "RAV4" } } as never,
    nextSearchPlan: plan,
  };
}

function comparisonItem(plan?: NextSearchPlan): SearchResultItem {
  return {
    type: "comparison",
    id: "comp-1",
    data: { title: "CR-V vs RAV4", image: { src: "/img.png", alt: "Comparison" } } as never,
    nextSearchPlan: plan,
  };
}

function trimItem(plan?: NextSearchPlan): SearchResultItem {
  return {
    type: "trim",
    id: "trim-1",
    data: { title: "XLE", imageUrl: "/trim.png", specs: [], id: "trim-1" },
    nextSearchPlan: plan,
  };
}

function editorialItem(plan?: NextSearchPlan): SearchResultItem {
  return {
    type: "editorial",
    id: "ed-1",
    data: { eyebrow: "Guide", headline: "Best SUVs", imageUrl: "/ed.png", href: "/guide" },
    nextSearchPlan: plan,
  };
}

function inventoryItem(): SearchResultItem {
  return {
    type: "inventory",
    id: "inv-1",
    data: { vin: "123", model: "Camry" } as never,
  };
}

function dealerOfferItem(): SearchResultItem {
  return {
    type: "dealer-offer",
    id: "offer-1",
    data: {} as never,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createResultCardRenderer", () => {
  describe("click behavior with nextSearchPlan", () => {
    it("calls submitTurn on model card click when plan is present", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      render(renderCard(modelItem(PLAN)));
      await user.click(screen.getByTestId("button-model-card"));

      expect(submitTurn).toHaveBeenCalledOnce();
      expect(submitTurn).toHaveBeenCalledWith({
        plan: PLAN,
        location: PLAN.location,
        autoSubmitted: true,
        label: "RAV4",
        source: "card",
      });
    });

    it("calls submitTurn on comparison card click when plan is present", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      render(renderCard(comparisonItem(PLAN)));
      await user.click(screen.getByTestId("button-comparison-card"));

      expect(submitTurn).toHaveBeenCalledOnce();
      expect(submitTurn).toHaveBeenCalledWith({
        plan: PLAN,
        location: PLAN.location,
        autoSubmitted: true,
        label: "CR-V vs RAV4",
        source: "card",
      });
    });

    it("calls submitTurn on trim card click when plan is present", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      render(renderCard(trimItem(PLAN)));
      await user.click(screen.getByTestId("button-trim-card"));

      expect(submitTurn).toHaveBeenCalledOnce();
      expect(submitTurn).toHaveBeenCalledWith({
        plan: PLAN,
        location: PLAN.location,
        autoSubmitted: true,
        label: "XLE",
        source: "card",
      });
    });

    it("calls submitTurn on editorial card click when plan is present", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      render(renderCard(editorialItem(PLAN)));
      await user.click(screen.getByTestId("button-editorial-card"));

      expect(submitTurn).toHaveBeenCalledOnce();
      expect(submitTurn).toHaveBeenCalledWith({
        plan: PLAN,
        location: PLAN.location,
        autoSubmitted: true,
        label: "Best SUVs",
        source: "card",
      });
    });

    it("tags the click source as 'pill' when sourceHint is pill", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      const explorationPlan: NextSearchPlan = { ...PLAN, responseMode: "OptionCards" };
      render(renderCard({ ...modelItem(explorationPlan), sourceHint: "pill" }));
      await user.click(screen.getByTestId("button-model-card"));

      expect(submitTurn).toHaveBeenCalledWith(
        expect.objectContaining({ source: "pill", label: "RAV4" })
      );
    });
  });

  describe("rendering without nextSearchPlan", () => {
    it("renders model card without onClick when no plan", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(modelItem()));

      expect(screen.getByTestId("button-model-card")).toBeInTheDocument();
    });

    it("renders editorial as LinkEditorialCard when no plan", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(editorialItem()));

      expect(screen.getByTestId("link-editorial-card")).toBeInTheDocument();
      expect(screen.queryByTestId("button-editorial-card")).not.toBeInTheDocument();
    });

    it("renders editorial as ButtonEditorialCard when plan is present", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(editorialItem(PLAN)));

      expect(screen.getByTestId("button-editorial-card")).toBeInTheDocument();
      expect(screen.queryByTestId("link-editorial-card")).not.toBeInTheDocument();
    });
  });

  describe("non-clickable card types", () => {
    it("renders inventory as LinkInventoryCard", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(inventoryItem()));

      expect(screen.getByTestId("link-inventory-card")).toBeInTheDocument();
    });

    it("passes ConversationalSearch as activitySource to the inventory card", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(inventoryItem()));

      expect(screen.getByTestId("link-inventory-card")).toHaveAttribute(
        "data-activity-source",
        "ConversationalSearch"
      );
    });

    it("renders dealer-offer as DealerOfferCard", () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);

      render(renderCard(dealerOfferItem()));

      expect(screen.getByTestId("dealer-offer-card")).toBeInTheDocument();
    });
  });

  describe("default location fallback", () => {
    it("falls back to the default zip when a plan has no location", async () => {
      const submitTurn = vi.fn();
      const renderCard = createResultCardRenderer(submitTurn);
      const user = userEvent.setup({ delay: null });

      const planWithoutLocation: NextSearchPlan = {
        searchId: "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789",
        filters: [{ key: "make", values: ["Honda"] }],
      };

      render(renderCard(modelItem(planWithoutLocation)));
      await user.click(screen.getByTestId("button-model-card"));

      expect(submitTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: planWithoutLocation,
          location: expect.objectContaining({ zipCode: "90210" }),
        })
      );
    });
  });
});

describe("createResultCardRenderer — readOnly mode", () => {
  it("renders model card as static (no button) when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(modelItem(PLAN)));

    expect(screen.getByTestId("static-model-card")).toBeInTheDocument();
    expect(screen.queryByTestId("button-model-card")).not.toBeInTheDocument();
  });

  it("renders comparison card as static when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(comparisonItem(PLAN)));

    expect(screen.getByTestId("static-comparison-card")).toBeInTheDocument();
    expect(screen.queryByTestId("button-comparison-card")).not.toBeInTheDocument();
  });

  it("renders trim card as static when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(trimItem(PLAN)));

    expect(screen.getByTestId("static-trim-card")).toBeInTheDocument();
    expect(screen.queryByTestId("button-trim-card")).not.toBeInTheDocument();
  });

  it("renders editorial card as static when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(editorialItem(PLAN)));

    expect(screen.getByTestId("static-editorial-card")).toBeInTheDocument();
    expect(screen.queryByTestId("button-editorial-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("link-editorial-card")).not.toBeInTheDocument();
  });

  it("renders inventory card as static (no link) when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(inventoryItem()));

    expect(screen.getByTestId("static-inventory-card")).toBeInTheDocument();
    expect(screen.queryByTestId("link-inventory-card")).not.toBeInTheDocument();
  });

  it("renders dealer-offer card with static prop when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(dealerOfferItem()));

    expect(screen.getByTestId("dealer-offer-card")).toBeInTheDocument();
  });

  it("does not call submitTurn when readOnly", () => {
    const submitTurn = vi.fn();
    const renderCard = createResultCardRenderer(submitTurn, { readOnly: true });

    render(renderCard(modelItem(PLAN)));

    // Static card has no click handler — just verify submitTurn wasn't called
    expect(submitTurn).not.toHaveBeenCalled();
  });
});
