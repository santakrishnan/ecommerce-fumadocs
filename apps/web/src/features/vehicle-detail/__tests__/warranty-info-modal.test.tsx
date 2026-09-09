/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import type { WarrantyInfo } from "../components/warranty-info-modal";
import { WarrantyInfoModal } from "../components/warranty-info-modal";

const BASE_WARRANTY: WarrantyInfo = {
  title: "Test Warranty Title",
  description: "Test warranty description text.",
  rows: [],
};

const WITH_STRING_ITEM: WarrantyInfo = {
  ...BASE_WARRANTY,
  rows: [{ label: "Powertrain warranty", value: { type: "text", text: "7 yr / 100,000 mi" } }],
};

const WITH_BOOLEAN_ITEM: WarrantyInfo = {
  ...BASE_WARRANTY,
  rows: [{ label: "Trade-ins accepted", value: { type: "check" } }],
};

const WITH_MIXED_ITEMS: WarrantyInfo = {
  ...BASE_WARRANTY,
  rows: [
    { label: "Comprehensive warranty", value: { type: "text", text: "12 mo / 12,000 mi" } },
    { label: "Quality Assurance Inspection", value: { type: "check" } },
    { label: "Roadside assistance", value: { type: "text", text: "7 yr / 100,000 mi" } },
    { label: "Free Carfax Report", value: { type: "check" } },
  ],
};

/* ─── Helpers ─── */

async function openModal(warranty = BASE_WARRANTY) {
  const user = userEvent.setup();
  render(<WarrantyInfoModal warranty={warranty} />);
  await user.click(screen.getByRole("button", { name: "More certification details" }));
  return user;
}

/* ─── Tests ─── */

describe("WarrantyInfoModal", () => {
  describe("closed state", () => {
    it("does not show modal content before the trigger is clicked", () => {
      render(<WarrantyInfoModal warranty={BASE_WARRANTY} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("open state", () => {
    it("opens the dialog when the trigger is clicked", async () => {
      await openModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders the warranty title inside the dialog", async () => {
      await openModal();
      expect(screen.getByRole("heading", { name: BASE_WARRANTY.title })).toBeInTheDocument();
    });

    it("renders the warranty description inside the dialog", async () => {
      await openModal();
      expect(screen.getByText(BASE_WARRANTY.description)).toBeInTheDocument();
    });

    it("closes the dialog when Escape is pressed", async () => {
      const user = await openModal();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes the dialog when the close button is clicked", async () => {
      const user = await openModal();
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("coverage list", () => {
    it("renders no list items when coverage is empty", async () => {
      await openModal(BASE_WARRANTY);
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("renders one list item per coverage entry", async () => {
      await openModal(WITH_MIXED_ITEMS);
      expect(screen.getAllByRole("listitem")).toHaveLength(WITH_MIXED_ITEMS.rows.length);
    });

    describe("string value items", () => {
      it("renders the item title", async () => {
        await openModal(WITH_STRING_ITEM);
        expect(screen.getByText("Powertrain warranty")).toBeInTheDocument();
      });

      it("renders the string value as text", async () => {
        await openModal(WITH_STRING_ITEM);
        expect(screen.getByText("7 yr / 100,000 mi")).toBeInTheDocument();
      });

      it("does not render a checkmark icon for string values", async () => {
        await openModal(WITH_STRING_ITEM);
        expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
      });
    });

    describe("boolean true value items", () => {
      it("renders the item title", async () => {
        await openModal(WITH_BOOLEAN_ITEM);
        expect(screen.getByText("Trade-ins accepted")).toBeInTheDocument();
      });

      it("renders a checkmark icon instead of text", async () => {
        await openModal(WITH_BOOLEAN_ITEM);
        // Icon is aria-hidden; confirm the title text has no sibling text value
        const item = screen.getByRole("listitem");
        expect(item.textContent).toBe("Trade-ins accepted");
      });

      it("does not render the boolean value as text", async () => {
        await openModal(WITH_BOOLEAN_ITEM);
        expect(screen.queryByText("true")).not.toBeInTheDocument();
      });
    });

    describe("mixed coverage items", () => {
      it("renders all item titles", async () => {
        await openModal(WITH_MIXED_ITEMS);
        for (const item of WITH_MIXED_ITEMS.rows) {
          expect(screen.getByText(item.label)).toBeInTheDocument();
        }
      });

      it("renders string values as text", async () => {
        await openModal(WITH_MIXED_ITEMS);
        expect(screen.getByText("12 mo / 12,000 mi")).toBeInTheDocument();
        expect(screen.getByText("7 yr / 100,000 mi")).toBeInTheDocument();
      });

      it("renders boolean items without exposing raw 'true' text", async () => {
        await openModal(WITH_MIXED_ITEMS);
        expect(screen.queryByText("true")).not.toBeInTheDocument();
      });
    });
  });
});
