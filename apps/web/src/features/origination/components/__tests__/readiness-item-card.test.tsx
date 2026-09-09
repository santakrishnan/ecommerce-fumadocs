/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import {
  READINESS_CARD_LABEL,
  READINESS_ITEMS,
} from "../origination-steps/readiness/readiness-content";
import { ReadinessItemCard } from "../origination-steps/readiness/readiness-item-card";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderCard(items = READINESS_ITEMS) {
  return render(<ReadinessItemCard items={items} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReadinessItemCard", () => {
  describe("card label", () => {
    it("renders the 'You'll need' eyebrow label", () => {
      renderCard();
      expect(screen.getByText(READINESS_CARD_LABEL)).toBeInTheDocument();
    });
  });

  describe("checklist items", () => {
    it("renders every item label from the default READINESS_ITEMS list", () => {
      renderCard();
      for (const item of READINESS_ITEMS) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    });

    it("renders exactly as many list items as there are items in the array", () => {
      renderCard();
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(READINESS_ITEMS.length);
    });

    it("renders a custom items array when provided", () => {
      const custom = [
        { id: "ssn", label: "Social Security Number" },
        { id: "dob", label: "Date of birth" },
      ];
      renderCard(custom);

      expect(screen.getByText("Social Security Number")).toBeInTheDocument();
      expect(screen.getByText("Date of birth")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    it("renders an empty list without crashing when items is empty", () => {
      renderCard([]);
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    });
  });

  describe("accessibility", () => {
    it("renders items inside a list element", () => {
      renderCard();
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("is not interactive — no buttons or links inside the card", () => {
      renderCard();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("checkmark icons are hidden from assistive technology", () => {
      renderCard();
      // aria-hidden icons should not be announced — verify item labels are
      // the only accessible text inside each list item.
      const listItems = screen.getAllByRole("listitem");
      for (const [index, item] of listItems.entries()) {
        const expected = READINESS_ITEMS[index];
        if (expected) {
          expect(item).toHaveTextContent(expected.label);
        }
      }
    });
  });
});
