/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { SPECS_FIXTURE_FULL, toVehicleSpecs } from "../__fixtures__/vehicle-specs.fixture";
import type { VehicleSpecs } from "../components/vehicle-specs-card/vehicle-specs-card";
import { VehicleSpecsCard } from "../components/vehicle-specs-card/vehicle-specs-card";

const VIEW_ALL_SPECS_PATTERN = /View All Specs/i;
const MOCK_VEHICLE_SPECS = toVehicleSpecs(SPECS_FIXTURE_FULL);

describe("VehicleSpecsCard", () => {
  describe("Rendering with full data", () => {
    it("renders section heading 'Vehicle Details'", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const heading = screen.getByRole("heading", { level: 2, name: "Vehicle Details" });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("body-md");
      expect(heading).toHaveClass("text-text-primary");
    });

    it("renders all 7 spec items in correct order", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      expect(screen.getByText("Drivetrain")).toBeInTheDocument();
      expect(screen.getByText("City / Hwy MPG")).toBeInTheDocument();
      expect(screen.getByText("Seating")).toBeInTheDocument();
      expect(screen.getByText("Transmission")).toBeInTheDocument();
      expect(screen.getByText("Engine")).toBeInTheDocument();
      expect(screen.getByText("Horsepower")).toBeInTheDocument();
      expect(screen.getByText("Fuel Type")).toBeInTheDocument();
    });

    it("renders drivetrain value", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("AWD")).toBeInTheDocument();
    });

    it("renders combined city/hwy MPG", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("35 / 34")).toBeInTheDocument();
    });

    it("renders seating with 'seats' suffix", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("7 seats")).toBeInTheDocument();
    });

    it("renders transmission type", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("Automatic")).toBeInTheDocument();
    });

    it("renders engine description", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("I-4 cyl")).toBeInTheDocument();
    });

    it("renders horsepower as string", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("295")).toBeInTheDocument();
    });

    it("renders fuel type", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);
      expect(screen.getByText("Hybrid")).toBeInTheDocument();
    });

    it("renders View All Specs button as link with arrow icon", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const button = screen.getByRole("button", { name: VIEW_ALL_SPECS_PATTERN });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("href", "#");
      expect(button).toHaveClass("h-auto");
      expect(button).toHaveClass("min-h-0");
      expect(button).toHaveClass("p-0");
    });
  });

  describe("Partial/missing data handling", () => {
    it("shows '—' (em dash) for missing drivetrain", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, drivetrain: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      const values = screen.getAllByText("—");
      expect(values.length).toBeGreaterThan(0);
    });

    it("shows '—' when both cityMpg and hwyMpg are missing", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, cityMpg: undefined, hwyMpg: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("shows '—' when only cityMpg is provided", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, hwyMpg: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      const values = screen.getAllByText("—");
      expect(values.length).toBeGreaterThan(0);
    });

    it("shows '—' when only hwyMpg is provided", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, cityMpg: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      const values = screen.getAllByText("—");
      expect(values.length).toBeGreaterThan(0);
    });

    it("shows '—' for missing seating", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, seating: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("shows '—' for missing transmission", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, transmissionType: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("shows '—' for missing engine", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, engine: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("shows '—' for missing horsepower", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, horsepower: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("shows '—' for missing fuelType", () => {
      const specs: VehicleSpecs = { ...MOCK_VEHICLE_SPECS, fuelType: undefined };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  describe("Styling and layout", () => {
    it("applies dark surface theme", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const card = container.querySelector('[data-surface="dark"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("bg-opacity-black-26");
    });

    it("has correct card styling (rounded, no border, no shadow)", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const card = container.querySelector('[data-surface="dark"]');
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border-0");
      expect(card).toHaveClass("shadow-none");
      expect(card).toHaveClass("ring-0");
    });

    it("has min-height on desktop", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const card = container.querySelector('[data-surface="dark"]');
      expect(card).toHaveClass("lg:min-h-117.5");
    });

    it("uses 2-column grid on mobile, 4-column on desktop", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });

    it("applies responsive gap to CardContent", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveClass("gap-10");
      expect(content).toHaveClass("lg:gap-16");
    });

    it("applies custom className prop", () => {
      const { container } = render(
        <VehicleSpecsCard className="custom-test-class" specs={MOCK_VEHICLE_SPECS} />
      );

      const card = container.querySelector('[data-surface="dark"]');
      expect(card).toHaveClass("custom-test-class");
    });

    it("uses semantic typography tokens for spec values", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const value = screen.getByText("AWD");
      expect(value).toHaveClass("body-xxl");
      expect(value).toHaveClass("text-text-primary");
    });

    it("uses semantic typography tokens for spec labels", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const label = screen.getByText("Drivetrain");
      expect(label).toHaveClass("body-md");
      expect(label).toHaveClass("text-text-primary");
    });
  });

  describe("Accessibility", () => {
    it("uses semantic heading (h2) for section title", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Vehicle Details");
    });

    it("renders button as link with proper role", () => {
      render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("href", "#");
    });

    it("has sufficient text contrast on dark background", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      const card = container.querySelector('[data-surface="dark"]');
      expect(card).toHaveAttribute("data-surface", "dark");

      const values = container.querySelectorAll(".text-text-primary");
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe("Server Component", () => {
    it("is a Server Component (no 'use client' directive)", () => {
      const { container } = render(<VehicleSpecsCard specs={MOCK_VEHICLE_SPECS} />);

      expect(container.querySelector('[data-surface="dark"]')).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles zero values correctly (not treated as missing)", () => {
      const specs: VehicleSpecs = {
        ...MOCK_VEHICLE_SPECS,
        cityMpg: 0,
        hwyMpg: 0,
        seating: 0,
        horsepower: 0,
      };
      render(<VehicleSpecsCard specs={specs} />);

      expect(screen.getByText("0 / 0")).toBeInTheDocument();
      expect(screen.getByText("0 seats")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders empty string values without fallback to em dash", () => {
      const specs: VehicleSpecs = {
        drivetrain: "",
        transmissionType: "",
        engine: "",
        fuelType: "",
      };
      render(<VehicleSpecsCard specs={specs} />);

      // Empty strings are not nullish, so ?? won't trigger — no "—" for those fields
      // But cityMpg/hwyMpg/seating/horsepower are undefined → show "—"
      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(3); // cityMpg, seating, horsepower
    });
  });
});
