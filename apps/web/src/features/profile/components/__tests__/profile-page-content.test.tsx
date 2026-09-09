/// <reference types="@testing-library/jest-dom" />
import { PROFILE_TIER_COOKIE } from "@config/profile-tier";
import { VDP_BOOKING_COOKIE } from "@config/vdp-booking-state";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePageContent } from "../profile-page-content";

const { mockCookies, mockGet, mockGetTradeInVehicles } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGet: vi.fn(),
  mockGetTradeInVehicles: vi.fn(),
}));

const cookieValues: Record<string, string | undefined> = {};

function setTier(value: string) {
  cookieValues[PROFILE_TIER_COOKIE] = value;
}

function setBookedVin(value: string) {
  cookieValues[VDP_BOOKING_COOKIE] = value;
}

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("server-only", () => ({}));

vi.mock("../../bff/use-cases/get-trade-in-vehicles", () => ({
  getTradeInVehicles: mockGetTradeInVehicles,
}));

vi.mock("../appointment-section", () => ({
  AppointmentSection: () => <div>Appointment slot</div>,
}));

vi.mock("../trade-in-section", () => ({
  TradeInSection: () => <div>Trade-in filled</div>,
}));

vi.mock("../trade-in-invitation-card", () => ({
  TradeInInvitationCard: () => <div>Trade-in invitation</div>,
}));

vi.mock("../profile-watchlist-content", () => ({
  ProfileWatchlistContent: () => <div>Watchlist</div>,
}));

vi.mock("@features/profile/watchlist/components/watchlist-saved-searches-section", () => ({
  WatchlistSavedSearchesSection: () => <div>Saved Searches</div>,
}));

async function renderProfilePageContent() {
  const ui = await ProfilePageContent({ searchParams: Promise.resolve({}) });
  return render(ui);
}

function getRenderedSlotsText(container: HTMLElement) {
  return (container.textContent ?? "").replace(/\s+/g, " ").trim();
}

function expectSlotOrder(renderedText: string, labelsInOrder: readonly string[]) {
  let previousIndex = -1;

  for (const label of labelsInOrder) {
    const labelIndex = renderedText.indexOf(label);
    expect(labelIndex).toBeGreaterThan(previousIndex);
    previousIndex = labelIndex;
  }
}

beforeEach(() => {
  for (const key of Object.keys(cookieValues)) {
    delete cookieValues[key];
  }
  mockGet.mockReset();
  mockGet.mockImplementation((name: string) => {
    const value = cookieValues[name];
    return value === undefined ? undefined : { value };
  });
  mockCookies.mockResolvedValue({ get: mockGet });
  mockGetTradeInVehicles.mockResolvedValue({ success: false, error: {} });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProfilePageContent", () => {
  it("resolves the tier in the async server leaf", async () => {
    setTier("t2");

    await renderProfilePageContent();

    expect(mockCookies).toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith(PROFILE_TIER_COOKIE);
  });

  describe("no saved vehicles (invitation below watchlist)", () => {
    beforeEach(() => {
      mockGetTradeInVehicles.mockResolvedValue({ success: false, error: {} });
    });

    it.each([
      "t0",
      "t1",
    ] as const)("renders watchlist then trade-in invitation for %s", async (tier) => {
      setTier(tier);
      const { container } = await renderProfilePageContent();
      const renderedText = getRenderedSlotsText(container);

      expect(screen.queryByText("Appointment slot")).not.toBeInTheDocument();
      expect(screen.queryByText("Trade-in filled")).not.toBeInTheDocument();
      expectSlotOrder(renderedText, ["Watchlist", "Trade-in invitation", "Saved Searches"]);
    });

    it.each([
      "t2",
      "t3",
    ] as const)("renders appointment, watchlist, trade-in invitation for %s", async (tier) => {
      setTier(tier);
      const { container } = await renderProfilePageContent();
      const renderedText = getRenderedSlotsText(container);

      expect(screen.queryByText("Trade-in filled")).not.toBeInTheDocument();
      expectSlotOrder(renderedText, [
        "Appointment slot",
        "Watchlist",
        "Trade-in invitation",
        "Saved Searches",
      ]);
    });
  });

  describe("saved vehicles (filled above watchlist)", () => {
    beforeEach(() => {
      mockGetTradeInVehicles.mockResolvedValue({
        success: true,
        data: [
          {
            title: "Test",
            year: 2022,
            estimatedValue: 10_000,
            licensePlate: "ABC",
            state: "NY",
            imageUrl: "",
          },
        ],
      });
    });

    it.each([
      "t0",
      "t1",
    ] as const)("renders trade-in filled then watchlist for %s", async (tier) => {
      setTier(tier);
      const { container } = await renderProfilePageContent();
      const renderedText = getRenderedSlotsText(container);

      expect(screen.queryByText("Appointment slot")).not.toBeInTheDocument();
      expect(screen.queryByText("Trade-in invitation")).not.toBeInTheDocument();
      expectSlotOrder(renderedText, ["Trade-in filled", "Watchlist", "Saved Searches"]);
    });

    it.each([
      "t2",
      "t3",
    ] as const)("renders appointment, trade-in filled, watchlist for %s", async (tier) => {
      setTier(tier);
      const { container } = await renderProfilePageContent();
      const renderedText = getRenderedSlotsText(container);

      expect(screen.queryByText("Trade-in invitation")).not.toBeInTheDocument();
      expectSlotOrder(renderedText, [
        "Appointment slot",
        "Trade-in filled",
        "Watchlist",
        "Saved Searches",
      ]);
    });
  });

  it("renders the same section structure for t2 and t3", async () => {
    setTier("t2");
    const firstRender = await renderProfilePageContent();
    const t2Slots = getRenderedSlotsText(firstRender.container);

    firstRender.unmount();

    setTier("t3");
    const secondRender = await renderProfilePageContent();
    const t3Slots = getRenderedSlotsText(secondRender.container);

    expect(t3Slots).toEqual(t2Slots);
  });

  it.each([
    "not-a-tier",
    "",
    "T1",
  ] as const)("falls back to the non-appointment structure for invalid cookie value '%s'", async (raw) => {
    setTier(raw);
    const { container } = await renderProfilePageContent();
    const renderedText = getRenderedSlotsText(container);

    expect(screen.queryByText("Appointment slot")).not.toBeInTheDocument();
    expectSlotOrder(renderedText, ["Watchlist", "Trade-in invitation", "Saved Searches"]);
  });

  it("renders the non-appointment structure when the cookie is missing", async () => {
    // no cookies set
    const { container } = await renderProfilePageContent();
    const renderedText = getRenderedSlotsText(container);

    expect(screen.queryByText("Appointment slot")).not.toBeInTheDocument();
    expectSlotOrder(renderedText, ["Watchlist", "Trade-in invitation", "Saved Searches"]);
  });

  it("shows the appointment slot for t1 when a VDP booking cookie is present", async () => {
    setTier("t1");
    setBookedVin("3TMDZ5BN8NM126690");
    const { container } = await renderProfilePageContent();
    const renderedText = getRenderedSlotsText(container);

    expect(screen.getByText("Appointment slot")).toBeInTheDocument();
    expectSlotOrder(renderedText, ["Appointment slot", "Watchlist"]);
  });
});
