/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { TradeInVehicle } from "../../bff/contracts/trade-in-response";
import { TradeInSection } from "../trade-in-section";

// Mock next/image
vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: test mock for next/image
  // biome-ignore lint/correctness/useImageSize: test mock for next/image
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("../trade-in-modal-shell", () => ({
  TradeInModalShell: () => <button type="button">View all</button>,
}));

const MOCK_VEHICLE: TradeInVehicle = {
  id: "trade-in-001",
  year: 2025,
  title: "MAZDA CX-5 2.5 S AWD",
  licensePlate: "XYZ5678",
  state: "NY",
  imageUrl: "/images/trade-in/sedan.png",
  estimatedValue: 20_600,
};

const MOCK_VEHICLE_2: TradeInVehicle = {
  id: "trade-in-002",
  year: 1992,
  title: "TOYOTA PREVIA",
  licensePlate: "8XYZ123",
  state: "NY",
  imageUrl: "/trade-in/truck.png",
  estimatedValue: 7950,
};

describe("TradeInSection", () => {
  describe("single vehicle", () => {
    it("renders 'Add a vehicle' button", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE]} />);
      expect(screen.getByText("Add a vehicle")).toBeInTheDocument();
    });

    it("does not render 'View all' button", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE]} />);
      expect(screen.queryByText("View all")).not.toBeInTheDocument();
    });

    it("renders the section header 'Your vehicle's value'", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE]} />);
      expect(screen.getByText("Your vehicle's value")).toBeInTheDocument();
    });

    it("renders the vehicle card", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE]} />);
      expect(screen.getAllByText("MAZDA CX-5 2.5 S AWD").length).toBeGreaterThan(0);
    });
  });

  describe("multiple vehicles", () => {
    it("renders 'View all' button", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE, MOCK_VEHICLE_2]} />);
      expect(screen.getByText("View all")).toBeInTheDocument();
    });

    it("does not render 'Add a vehicle' button", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE, MOCK_VEHICLE_2]} />);
      expect(screen.queryByText("Add a vehicle")).not.toBeInTheDocument();
    });

    it("renders the section header with vehicle count", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE, MOCK_VEHICLE_2]} />);
      expect(screen.getByText("Trade-ins (2)")).toBeInTheDocument();
    });

    it("renders only the first vehicle card", () => {
      render(<TradeInSection vehicles={[MOCK_VEHICLE, MOCK_VEHICLE_2]} />);
      expect(screen.getAllByText("MAZDA CX-5 2.5 S AWD").length).toBeGreaterThan(0);
      expect(screen.queryByText("TOYOTA PREVIA")).not.toBeInTheDocument();
    });
  });
});
