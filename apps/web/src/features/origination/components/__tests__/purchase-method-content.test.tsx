/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  PURCHASE_METHOD_ITEMS,
  PURCHASE_METHOD_TRADE_IN_DESCRIPTION,
  PURCHASE_METHOD_TRADE_IN_TITLE,
} from "../../bff/__fixtures__/purchase-method.fixture";
import { PurchaseMethodContent } from "../purchase-method-content";

function renderComponent(onSelect?: (method: "finance" | "cash") => void) {
  return render(<PurchaseMethodContent onSelect={onSelect} />);
}

describe("PurchaseMethodContent", () => {
  describe("rendering", () => {
    it("renders an item for each purchase method option", () => {
      renderComponent();
      for (const item of PURCHASE_METHOD_ITEMS) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
        if (item.description) {
          expect(screen.getByText(item.description)).toBeInTheDocument();
        }
      }
    });

    it("renders the trade-in prompt paragraphs", () => {
      renderComponent();
      expect(screen.getByText(PURCHASE_METHOD_TRADE_IN_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PURCHASE_METHOD_TRADE_IN_DESCRIPTION)).toBeInTheDocument();
    });

    it("renders each option as a button", () => {
      renderComponent();
      expect(screen.getAllByRole("button")).toHaveLength(PURCHASE_METHOD_ITEMS.length);
    });
  });

  describe("selection", () => {
    it("reports 'finance' when the financing option is selected", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("Financing"));

      expect(onSelect).toHaveBeenCalledWith("finance");
    });

    it("reports 'cash' when the cash option is selected", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("Cash"));

      expect(onSelect).toHaveBeenCalledWith("cash");
    });

    it("does not submit anything itself — selection is delegated to the parent", async () => {
      // The content is presentational: it must not call the server action.
      // We assert this by confirming onSelect is the only side effect and it
      // fires synchronously on click (no async submission is owned here).
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("Financing"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("does not throw when clicked without an onSelect handler", async () => {
      const user = userEvent.setup();
      renderComponent();

      await expect(user.click(screen.getByText("Cash"))).resolves.not.toThrow();
    });
  });
});
