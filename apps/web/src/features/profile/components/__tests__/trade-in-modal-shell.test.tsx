/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { TRADE_IN_VEHICLES_FIXTURE } from "../../bff/__fixtures__/trade-in.fixture";
import { TradeInModalShell } from "../trade-in-modal-shell";

const VIEW_ALL_BUTTON_PATTERN = /view all/i;
const ADD_ANOTHER_BUTTON_PATTERN = /add another trade-in/i;
const VEHICLE_COUNT = TRADE_IN_VEHICLES_FIXTURE.length;

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <div aria-label={alt} data-src={src} role="img" />
  ),
}));

vi.mock("../trade-in-add-vehicle-shell", () => ({
  TradeInAddVehicleShell: ({ externalOpen }: { externalOpen?: boolean }) =>
    externalOpen ? <div data-testid="add-vehicle-overlay" /> : null,
}));

describe("TradeInModalShell", () => {
  it("opens the modal and renders all vehicles when 'View all' is clicked", async () => {
    const user = userEvent.setup();
    const titlePattern = new RegExp(`Trade-ins \\(${VEHICLE_COUNT}\\)`, "i");

    render(<TradeInModalShell vehicles={TRADE_IN_VEHICLES_FIXTURE} />);

    // Modal content should not be visible initially
    expect(screen.queryByText(titlePattern)).not.toBeInTheDocument();

    // Click "View all" to open modal
    await user.click(screen.getByRole("button", { name: VIEW_ALL_BUTTON_PATTERN }));

    // Modal title with count should be visible
    expect(screen.getByText(titlePattern)).toBeInTheDocument();

    // All vehicle titles should render inside the modal
    for (const vehicle of TRADE_IN_VEHICLES_FIXTURE) {
      expect(screen.getAllByText(vehicle.title).length).toBeGreaterThan(0);
    }
  });

  it("renders the 'Add another trade-in' button inside the modal", async () => {
    const user = userEvent.setup();

    render(<TradeInModalShell vehicles={TRADE_IN_VEHICLES_FIXTURE} />);

    await user.click(screen.getByRole("button", { name: VIEW_ALL_BUTTON_PATTERN }));

    expect(screen.getByRole("button", { name: ADD_ANOTHER_BUTTON_PATTERN })).toBeInTheDocument();
  });

  it("closes the modal when 'Add another trade-in' is clicked", async () => {
    const user = userEvent.setup();
    const titlePattern = new RegExp(`Trade-ins \\(${VEHICLE_COUNT}\\)`, "i");

    render(<TradeInModalShell vehicles={TRADE_IN_VEHICLES_FIXTURE} />);

    await user.click(screen.getByRole("button", { name: VIEW_ALL_BUTTON_PATTERN }));
    expect(screen.getByText(titlePattern)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: ADD_ANOTHER_BUTTON_PATTERN }));

    expect(screen.queryByText(titlePattern)).not.toBeInTheDocument();
  });
});
