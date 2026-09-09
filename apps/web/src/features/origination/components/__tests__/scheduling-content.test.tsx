/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { SCHEDULING_CONTEXT_FIXTURE } from "../../bff/__fixtures__/scheduling.fixture";
import { SchedulingContent } from "../scheduling-content";

const { days } = SCHEDULING_CONTEXT_FIXTURE;
const firstDay = days[0]!;
const secondDay = days[1]!;

function renderComponent() {
  return render(<SchedulingContent days={days} />);
}

describe("SchedulingContent", () => {
  describe("day selector", () => {
    it("shows the first day's label by default", () => {
      renderComponent();

      expect(screen.getByText(firstDay.label)).toBeInTheDocument();
    });

    it("disables the previous button on the first day", () => {
      renderComponent();

      expect(screen.getByRole("button", { name: "Previous day" })).toBeDisabled();
    });

    it("advances to the next day when the next button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Next day" }));

      expect(screen.getByText(secondDay.label)).toBeInTheDocument();
    });

    it("disables the next button on the last day", async () => {
      const user = userEvent.setup();
      renderComponent();

      const nextButton = screen.getByRole("button", { name: "Next day" });
      for (let i = 0; i < days.length - 1; i++) {
        await user.click(nextButton);
      }

      expect(nextButton).toBeDisabled();
    });
  });

  describe("time slots", () => {
    it("renders a button for every slot of the current day", () => {
      renderComponent();

      for (const slot of firstDay.timeSlots) {
        expect(screen.getByRole("button", { name: slot.time })).toBeInTheDocument();
      }
    });

    it("disables unavailable slots", () => {
      renderComponent();

      const unavailable = firstDay.timeSlots.find((slot) => !slot.available);
      expect(unavailable).toBeDefined();

      expect(screen.getByRole("button", { name: unavailable?.time })).toBeDisabled();
    });
  });

  describe("empty state", () => {
    it("renders nothing when there are no bookable days", () => {
      const { container } = render(<SchedulingContent days={[]} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("initialData", () => {
    it("starts on the provided day when the date is available", () => {
      render(<SchedulingContent days={days} initialData={{ date: secondDay.date }} />);

      expect(screen.getByText(secondDay.label)).toBeInTheDocument();
    });

    it("falls back to the first day when the provided date is not available", () => {
      render(<SchedulingContent days={days} initialData={{ date: "2099-01-01" }} />);

      expect(screen.getByText(firstDay.label)).toBeInTheDocument();
    });
  });
});
