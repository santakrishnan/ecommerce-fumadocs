/// <reference types="@testing-library/jest-dom" />
import { DEALER_BAY_RIDGE } from "@features/vehicle-detail/__fixtures__";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { PurchaseCardRailSkeleton, resolveTestDrive } from "../purchase-card-rail";

describe("PurchaseCardRailSkeleton", () => {
  it("renders the root skeleton card shell", () => {
    const { container } = render(<PurchaseCardRailSkeleton />);
    expect(container.querySelector('[data-slot="purchase-card-skeleton"]')).toBeInTheDocument();
  });

  it("preserves the desktop width cap alongside the XL override", () => {
    const { container } = render(<PurchaseCardRailSkeleton />);
    const skeleton = container.querySelector('[data-slot="purchase-card-skeleton"]');
    expect(skeleton).toHaveClass("lg:max-w-md", "xl:max-w-none");
  });

  it("renders static text placeholders for card identity", () => {
    render(<PurchaseCardRailSkeleton />);
    expect(screen.getByText("$00,000")).toBeInTheDocument();
    expect(screen.getByText("Car name")).toBeInTheDocument();
    expect(screen.getByText("Year · Mileage")).toBeInTheDocument();
  });

  it("renders schedule heading and time-pill placeholders", () => {
    const { container } = render(<PurchaseCardRailSkeleton />);
    expect(screen.getByText("Schedule a test drive")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(10);
  });
});

describe("resolveTestDrive", () => {
  it("falls back to the fixture when the live test drive is null", () => {
    const resolved = resolveTestDrive(null);

    expect(resolved.dayLabel).toBe(DEALER_BAY_RIDGE.testDrive?.dayLabel);
    expect(resolved.slots).toEqual(DEALER_BAY_RIDGE.testDrive?.slots);
  });

  it("falls back to the fixture when the live test drive has no slots", () => {
    const resolved = resolveTestDrive({ date: "2026-07-17", dayLabel: "Today", slots: [] });

    expect(resolved.dayLabel).toBe(DEALER_BAY_RIDGE.testDrive?.dayLabel);
    expect(resolved.slots).toEqual(DEALER_BAY_RIDGE.testDrive?.slots);
  });

  it("keeps live slots when they are available", () => {
    const liveTestDrive = { date: "2026-07-18", dayLabel: "Tomorrow", slots: ["10:00 AM"] };
    const resolved = resolveTestDrive(liveTestDrive);

    expect(resolved).toBe(liveTestDrive);
  });
});
