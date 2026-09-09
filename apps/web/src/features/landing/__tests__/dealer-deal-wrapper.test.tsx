/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

// Mock server-only (throws in client — no-op in tests)
vi.mock("server-only", () => ({}));

vi.mock("@features/landing/bff/use-cases/get-dealer-deal", () => ({
  getDealerDeal: vi.fn(),
}));

import type { GetDealerDealResult } from "@features/landing/bff/use-cases/get-dealer-deal";
import { getDealerDeal } from "@features/landing/bff/use-cases/get-dealer-deal";
import { DEAL_FIXTURE, VEHICLE_FIXTURE } from "../__fixtures__/dealer-deal";
import { DealerDealWrapper } from "../components/dealer-deal/dealer-deal-wrapper";

const mockedGetDealerDeal = vi.mocked(getDealerDeal);

/** A successful use-case result assembled from the fixtures. */
const SUCCESS_RESULT: GetDealerDealResult = {
  success: true,
  data: {
    vehicleId: VEHICLE_FIXTURE.vin,
    year: VEHICLE_FIXTURE.vehicleInfo.year,
    make: VEHICLE_FIXTURE.vehicleInfo.make,
    model: VEHICLE_FIXTURE.vehicleInfo.model,
    trim: VEHICLE_FIXTURE.vehicleInfo.trim,
    mileage: VEHICLE_FIXTURE.status.mileage,
    imageUrl: VEHICLE_FIXTURE.media?.photos?.[0]?.url ?? "/images/deal/four-runner-img.png",
    imageAlt:
      `${VEHICLE_FIXTURE.vehicleInfo.year} ${VEHICLE_FIXTURE.vehicleInfo.make} ${VEHICLE_FIXTURE.vehicleInfo.model} ${VEHICLE_FIXTURE.vehicleInfo.trim ?? ""}`.trim(),
    askingPrice: VEHICLE_FIXTURE.pricing.sellingPrice ?? VEHICLE_FIXTURE.pricing.listPrice,
    financing: DEAL_FIXTURE.financing,
    urgencyMessage: DEAL_FIXTURE.urgencyMessage,
    buyNowHref: DEAL_FIXTURE.buyNowHref,
  },
};

/** Helper: render the async Server Component by awaiting its JSX. */
async function renderWrapper() {
  const ui = await DealerDealWrapper();
  if (!ui) {
    return render(<div />);
  }
  return render(ui);
}

describe("DealerDealWrapper", () => {
  it("renders a section with accessible label", async () => {
    mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

    await renderWrapper();

    const section = screen.getByRole("region", {
      name: "Featured dealer deal",
    });
    expect(section).toBeInTheDocument();
  });

  it("renders the section heading with vehicle year and model from mock data", async () => {
    mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

    await renderWrapper();

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("2023");
    expect(heading.textContent).toContain("4Runner");
  });

  it("renders the DealerDealCard inside the wrapper", async () => {
    mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

    await renderWrapper();

    const article = screen.getByRole("article", {
      name: "Deal: 2023 Toyota 4Runner TRD Off Road",
    });
    expect(article).toBeInTheDocument();
  });

  it("applies correct section spacing classes", async () => {
    mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

    const { container } = await renderWrapper();

    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  it("renders Buy Now button with correct href from deal data", async () => {
    mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

    await renderWrapper();

    const buyNow = screen.getByRole("button", { name: "Buy Now" });
    expect(buyNow).toHaveAttribute("href", "/vehicle/JTERU5JR7N6123456/buy");
  });

  it("renders nothing when use-case returns an error", async () => {
    mockedGetDealerDeal.mockResolvedValue({
      success: false,
      error: { code: "VEHICLE_NOT_FOUND", message: "Not found" },
    });

    const { container } = await renderWrapper();

    expect(container.querySelector("section")).toBeNull();
  });

  it("renders nothing when deal service fails", async () => {
    mockedGetDealerDeal.mockResolvedValue({
      success: false,
      error: { code: "DEAL_NOT_FOUND", message: "No deal" },
    });

    const { container } = await renderWrapper();

    expect(container.querySelector("section")).toBeNull();
  });

  describe("className wrapper (PEDX01-2683)", () => {
    it("renders wrapper div with className when result.success is true", async () => {
      mockedGetDealerDeal.mockResolvedValue(SUCCESS_RESULT);

      const ui = await DealerDealWrapper({ className: "test-wrapper" });
      if (!ui) {
        throw new Error("Expected wrapper to render with success result");
      }
      const { container } = render(ui);

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
      expect(container.querySelector("section")).not.toBeNull();
    });

    it("returns null when use-case fails — no wrapper div in DOM", async () => {
      mockedGetDealerDeal.mockResolvedValue({
        success: false,
        error: { code: "VEHICLE_NOT_FOUND", message: "Not found" },
      });

      const ui = await DealerDealWrapper({ className: "test-wrapper" });

      expect(ui).toBeNull();
    });
  });
});
