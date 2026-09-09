/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { rav4Xse, rav4XseNoTrim, rav4XsePriced } from "../../../__fixtures__/compare-vehicle";
import { VehicleSelector, VehicleSelectorList } from "../vehicle-selector";

const FIXTURE_VEHICLES = [rav4Xse, rav4XseNoTrim, rav4XsePriced];
const RAV4_XSE_REGEX = /TOYOTA RAV4 XSE/i;
const TRIGGER_LABEL_REGEX = /select vehicle for comparison/i;

describe("VehicleSelector", () => {
  const defaultProps = {
    onOpenChange: vi.fn(),
    selectedVehicleId: rav4Xse.id,
    vehicles: FIXTURE_VEHICLES,
  };

  describe("rendering", () => {
    it("renders the selected vehicle card", () => {
      render(<VehicleSelector {...defaultProps} />);
      expect(screen.getByText(RAV4_XSE_REGEX)).toBeInTheDocument();
    });

    it("renders a trigger button with accessible label", () => {
      render(<VehicleSelector {...defaultProps} />);
      const button = screen.getByRole("button", { name: TRIGGER_LABEL_REGEX });
      expect(button).toBeInTheDocument();
    });

    it("renders an SVG icon in the trigger (caret)", () => {
      const { container } = render(<VehicleSelector {...defaultProps} open={false} />);
      const svg = container.querySelector("button svg");
      expect(svg).toBeInTheDocument();
    });

    it("returns null when vehicles array is empty", () => {
      const { container } = render(
        <VehicleSelector {...defaultProps} selectedVehicleId="nonexistent" vehicles={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("falls back to first vehicle when selectedVehicleId does not match", () => {
      render(<VehicleSelector {...defaultProps} selectedVehicleId="nonexistent" />);
      expect(screen.getByText(RAV4_XSE_REGEX)).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onOpenChange(true) when clicked while closed", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<VehicleSelector {...defaultProps} onOpenChange={onOpenChange} open={false} />);
      const button = screen.getByRole("button", { name: TRIGGER_LABEL_REGEX });
      await user.click(button);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("calls onOpenChange(false) when clicked while open", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<VehicleSelector {...defaultProps} onOpenChange={onOpenChange} open={true} />);
      const button = screen.getByRole("button", { name: TRIGGER_LABEL_REGEX });
      await user.click(button);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("VehicleSelectorList", () => {
  const defaultProps = {
    onSelect: vi.fn(),
    selectedVehicleId: rav4Xse.id,
    vehicles: FIXTURE_VEHICLES,
  };

  describe("rendering", () => {
    it("renders a listbox container", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("renders all vehicles as options", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(FIXTURE_VEHICLES.length);
    });

    it("marks the selected vehicle with aria-selected=true", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      const selectedOption = options.find((opt) => opt.getAttribute("aria-selected") === "true");
      expect(selectedOption).toBeInTheDocument();
    });

    it("applies bg-neutral-100 to selected item", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      const selectedOption = options.find((opt) => opt.getAttribute("aria-selected") === "true");
      expect(selectedOption?.className).toContain("bg-neutral-100");
    });

    it("renders selected overlay with checkmark on selected vehicle", () => {
      const { container } = render(<VehicleSelectorList {...defaultProps} />);
      const overlay = container.querySelector(
        "[aria-selected='true'] [data-slot='vehicle-card-image-overlay']"
      );
      expect(overlay).toBeInTheDocument();
    });

    it("does not render checkmark overlay on non-selected vehicles", () => {
      const { container } = render(
        <VehicleSelectorList {...defaultProps} selectedVehicleId="nonexistent" />
      );
      const overlay = container.querySelector("[data-slot='vehicle-card-image-overlay']");
      expect(overlay).not.toBeInTheDocument();
    });

    it("renders compact cards with vehicle-card data-slot", () => {
      const { container } = render(<VehicleSelectorList {...defaultProps} />);
      const cards = container.querySelectorAll("[data-slot='vehicle-card']");
      expect(cards).toHaveLength(FIXTURE_VEHICLES.length);
    });
  });

  describe("interactions", () => {
    it("calls onSelect with vehicle id on click", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<VehicleSelectorList {...defaultProps} onSelect={onSelect} />);
      const options = screen.getAllByRole("option");
      await user.click(options[1] as HTMLElement);
      expect(onSelect).toHaveBeenCalledWith(rav4XseNoTrim.id);
    });

    it("calls onSelect on Enter keypress", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<VehicleSelectorList {...defaultProps} onSelect={onSelect} />);
      const options = screen.getAllByRole("option");
      (options[0] as HTMLElement).focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      expect(onSelect).toHaveBeenCalledWith(rav4XseNoTrim.id);
    });

    it("calls onSelect on Space keypress", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<VehicleSelectorList {...defaultProps} onSelect={onSelect} />);
      const options = screen.getAllByRole("option");
      (options[0] as HTMLElement).focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      await user.keyboard(" ");
      expect(onSelect).toHaveBeenCalledWith(rav4XsePriced.id);
    });
  });

  describe("keyboard navigation (roving tabindex)", () => {
    it("ArrowDown moves focus to the next option", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[0] as HTMLElement).focus();
      await user.keyboard("{ArrowDown}");
      expect(options[1]).toHaveFocus();
    });

    it("ArrowUp moves focus to the previous option", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[1] as HTMLElement).focus();
      await user.keyboard("{ArrowUp}");
      expect(options[0]).toHaveFocus();
    });

    it("ArrowDown wraps from last to first", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[2] as HTMLElement).focus();
      await user.keyboard("{ArrowDown}");
      expect(options[0]).toHaveFocus();
    });

    it("ArrowUp wraps from first to last", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[0] as HTMLElement).focus();
      await user.keyboard("{ArrowUp}");
      expect(options[2]).toHaveFocus();
    });

    it("Home moves focus to first option", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[2] as HTMLElement).focus();
      await user.keyboard("{Home}");
      expect(options[0]).toHaveFocus();
    });

    it("End moves focus to last option", async () => {
      const user = userEvent.setup();
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      (options[0] as HTMLElement).focus();
      await user.keyboard("{End}");
      expect(options[2]).toHaveFocus();
    });
  });

  describe("accessibility", () => {
    it("selected option has tabIndex=0, others have tabIndex=-1", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      const options = screen.getAllByRole("option");
      // First vehicle is selected, so it gets tabIndex 0
      expect(options[0]).toHaveAttribute("tabindex", "0");
      expect(options[1]).toHaveAttribute("tabindex", "-1");
      expect(options[2]).toHaveAttribute("tabindex", "-1");
    });

    it("container has role=listbox with aria-label", () => {
      render(<VehicleSelectorList {...defaultProps} />);
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute("aria-label", "Available vehicles");
    });
  });
});
