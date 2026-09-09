/// <reference types="@testing-library/jest-dom" />

import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { BookingStrip } from "../booking-strip";

const DEFAULT_SLOTS = ["12:00 PM", "2:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"];
const RE_TEST_DRIVE = /You have a test drive/;

describe("BookingStrip", () => {
  it("renders the 'Schedule a test drive' heading", () => {
    render(<BookingStrip dayLabel="Today" slots={DEFAULT_SLOTS} />);

    expect(screen.getByText("Schedule a test drive")).toBeInTheDocument();
  });

  it("renders the day label", () => {
    render(<BookingStrip dayLabel="Today" slots={DEFAULT_SLOTS} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders all time slot buttons", () => {
    render(<BookingStrip dayLabel="Today" slots={DEFAULT_SLOTS} />);

    for (const slot of DEFAULT_SLOTS) {
      expect(
        screen.getByRole("button", { name: `Book test drive at ${slot}` })
      ).toBeInTheDocument();
    }
  });

  it("renders nothing when slots array is empty", () => {
    const { container } = render(<BookingStrip dayLabel="Today" slots={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("calls onSlotSelect when a time slot is clicked", async () => {
    const onSlotSelect = vi.fn();
    const user = userEvent.setup();

    render(<BookingStrip dayLabel="Today" onSlotSelect={onSlotSelect} slots={DEFAULT_SLOTS} />);

    await user.click(screen.getByRole("button", { name: "Book test drive at 2:30 PM" }));

    expect(onSlotSelect).toHaveBeenCalledWith("2:30 PM");
  });

  it("renders carousel navigation arrows", () => {
    render(<BookingStrip dayLabel="Today" slots={DEFAULT_SLOTS} />);

    expect(screen.getByRole("button", { name: "Previous time slots" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next time slots" })).toBeInTheDocument();
  });

  it("renders a confirmation note when provided", () => {
    render(
      <BookingStrip
        confirmationNote="You have a test drive at Toyota of Manhattan today at 2:30 PM"
        dayLabel="Today"
        slots={DEFAULT_SLOTS}
      />
    );

    expect(
      screen.getByText("You have a test drive at Toyota of Manhattan today at 2:30 PM")
    ).toBeInTheDocument();
  });

  it("does not render confirmation note when not provided", () => {
    render(<BookingStrip dayLabel="Today" slots={DEFAULT_SLOTS} />);

    expect(screen.queryByText(RE_TEST_DRIVE)).not.toBeInTheDocument();
  });

  it("renders with different day labels", () => {
    render(<BookingStrip dayLabel="Tomorrow" slots={["9:00 AM", "10:30 AM"]} />);

    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book test drive at 9:00 AM" })).toBeInTheDocument();
  });
});
