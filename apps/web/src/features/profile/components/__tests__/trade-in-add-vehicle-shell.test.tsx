/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

const ADD_VEHICLE_PATTERN = /add a vehicle/i;

vi.mock("../trade-in-invitation-card", () => ({
  TradeInInvitationCard: ({ onComplete }: { onComplete?: () => void }) => (
    <div data-testid="trade-in-invitation-card">
      <button onClick={onComplete} type="button">
        Complete
      </button>
    </div>
  ),
}));

describe("TradeInAddVehicleShell", () => {
  it("renders the 'Add a vehicle' trigger button by default", async () => {
    const { TradeInAddVehicleShell } = await import("../trade-in-add-vehicle-shell");
    render(<TradeInAddVehicleShell />);

    expect(screen.getByRole("button", { name: ADD_VEHICLE_PATTERN })).toBeInTheDocument();
  });

  it("does not render trigger when showTrigger is false", async () => {
    const { TradeInAddVehicleShell } = await import("../trade-in-add-vehicle-shell");
    render(<TradeInAddVehicleShell showTrigger={false} />);

    expect(screen.queryByRole("button", { name: ADD_VEHICLE_PATTERN })).not.toBeInTheDocument();
  });

  it("opens the overlay on trigger click", async () => {
    const user = userEvent.setup();
    const { TradeInAddVehicleShell } = await import("../trade-in-add-vehicle-shell");
    render(<TradeInAddVehicleShell />);

    await user.click(screen.getByRole("button", { name: ADD_VEHICLE_PATTERN }));

    expect(screen.getByTestId("trade-in-invitation-card")).toBeInTheDocument();
  });

  it("opens the overlay when externalOpen is true", async () => {
    const { TradeInAddVehicleShell } = await import("../trade-in-add-vehicle-shell");
    render(<TradeInAddVehicleShell externalOpen={true} showTrigger={false} />);

    expect(screen.getByTestId("trade-in-invitation-card")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when onComplete fires", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { TradeInAddVehicleShell } = await import("../trade-in-add-vehicle-shell");
    render(
      <TradeInAddVehicleShell externalOpen={true} onOpenChange={onOpenChange} showTrigger={false} />
    );

    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
