/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { TRADE_IN_VEHICLES_FIXTURE } from "../../bff/__fixtures__/trade-in.fixture";
import { TradeInVehicleCard } from "../trade-in-vehicle-card";

// Mock next/image
vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: test mock for next/image
  // biome-ignore lint/correctness/useImageSize: test mock for next/image
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

// biome-ignore lint/style/noNonNullAssertion: fixture array is guaranteed to have at least one item
const MOCK_VEHICLE = TRADE_IN_VEHICLES_FIXTURE[0]!;
const ESTIMATED_VALUE_REGEX = /\$20,600/;

describe("TradeInVehicleCard", () => {
  it("renders the vehicle year", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByText(String(MOCK_VEHICLE.year)).length).toBeGreaterThan(0);
  });

  it("renders the vehicle title", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByText("MAZDA CX-5 2.5 S AWD").length).toBeGreaterThan(0);
  });

  it("renders the license plate and state", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByText("XYZ5678 · NY").length).toBeGreaterThan(0);
  });

  it("renders the estimated value formatted as currency", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByText(ESTIMATED_VALUE_REGEX).length).toBeGreaterThan(0);
  });

  it("renders the disclaimer text", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(
      screen.getAllByText(
        "*Estimated value, subject to the condition you tell us and in-person inspection."
      ).length
    ).toBeGreaterThan(0);
  });

  it("renders the vehicle image with correct alt text", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    const images = screen.getAllByAltText(`${MOCK_VEHICLE.year} ${MOCK_VEHICLE.title}`);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute("src", "/images/trade-in/sedan.png");
  });

  it("renders the overflow menu button", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByLabelText("More options").length).toBeGreaterThan(0);
  });
});

describe("TradeInVehicleCard — action prop", () => {
  it("renders the action button when action is provided", () => {
    render(
      <TradeInVehicleCard
        action={{ label: "Add vehicle to profile", onAction: vi.fn() }}
        vehicle={MOCK_VEHICLE}
      />
    );
    expect(screen.getAllByText("Add vehicle to profile").length).toBeGreaterThan(0);
  });

  it("does not render the action button when action is not provided", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.queryByText("Add vehicle to profile")).not.toBeInTheDocument();
  });

  it("calls onAction when the action button is clicked", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const handleAction = vi.fn();
    render(
      <TradeInVehicleCard
        action={{ label: "Add vehicle to profile", onAction: handleAction }}
        vehicle={MOCK_VEHICLE}
      />
    );
    const buttons = screen.getAllByText("Add vehicle to profile");
    const button = buttons[0];
    if (button) {
      await userEvent.setup().click(button);
    }
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

describe("TradeInVehicleCard — showOverflowMenu prop", () => {
  it("hides the overflow menu when showOverflowMenu is false", () => {
    render(<TradeInVehicleCard showOverflowMenu={false} vehicle={MOCK_VEHICLE} />);
    expect(screen.queryByLabelText("More options")).not.toBeInTheDocument();
  });

  it("shows the overflow menu by default", () => {
    render(<TradeInVehicleCard vehicle={MOCK_VEHICLE} />);
    expect(screen.getAllByLabelText("More options").length).toBeGreaterThan(0);
  });
});
