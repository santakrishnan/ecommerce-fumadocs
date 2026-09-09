/// <reference types="@testing-library/jest-dom" />

import type { WatchlistItem } from "@features/profile/watchlist/bff";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileWatchlistContent } from "../profile-watchlist-content";

const { mockGetWatchlist } = vi.hoisted(() => ({
  mockGetWatchlist: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@features/profile/watchlist/bff", () => ({
  getWatchlist: mockGetWatchlist,
}));

vi.mock("@features/profile/watchlist/components/watchlist-card", () => ({
  WatchlistCard: () => <div>Watchlist card</div>,
}));

const COMPARE_CTA_NAME = /compare/i;

function makeItems(count: number): WatchlistItem[] {
  return Array.from({ length: count }, (_, i) => ({
    createdAt: "2026-08-04T21:43:29.610Z",
    lastActiveAt: "2026-08-04T21:43:29.610Z",
    price: 40_000,
    title: `Vehicle ${i + 1}`,
    updatedAt: "2026-08-04T21:43:29.610Z",
    vehicleId: `veh-${i + 1}`,
    vin: `VIN00000000000${String(i).padStart(3, "0")}`,
  }));
}

async function renderContent() {
  const ui = await ProfileWatchlistContent({ searchParams: Promise.resolve({}) });
  return render(ui);
}

beforeEach(() => {
  mockGetWatchlist.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProfileWatchlistContent — Compare CTA", () => {
  it("shows the Compare CTA linking to the compare page when 3+ vehicles are saved", async () => {
    mockGetWatchlist.mockResolvedValue({ success: true, data: makeItems(3) });

    await renderContent();

    const cta = screen.getByRole("button", { name: COMPARE_CTA_NAME });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/profile/watchlist");
  });

  it("hides the Compare CTA when fewer than 3 vehicles are saved", async () => {
    mockGetWatchlist.mockResolvedValue({ success: true, data: makeItems(2) });

    await renderContent();

    expect(screen.queryByRole("button", { name: COMPARE_CTA_NAME })).not.toBeInTheDocument();
  });

  it("hides the Compare CTA when the watchlist fetch fails", async () => {
    mockGetWatchlist.mockResolvedValue({ success: false, error: { code: "InternalError" } });

    await renderContent();

    expect(screen.queryByRole("button", { name: COMPARE_CTA_NAME })).not.toBeInTheDocument();
  });
});
