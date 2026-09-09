/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { ADD_NON_TAXABLE_INCOME_LABEL, IncomeContent } from "../income-content";

const NEGATIVE_AMOUNT_ERROR_PATTERN = /amount cannot be negative/i;

function renderComponent() {
  return render(<IncomeContent />);
}

describe("IncomeContent", () => {
  describe("text input", () => {
    it("formats an all-digit value with a dollar sign and thousand separators", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "75000");

      expect(input).toHaveValue("$75,000");
    });

    it("keeps letters in the input and shows a validation error", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "abc");
      await user.tab();

      expect(input).toHaveValue("abc");
      expect(await screen.findByText("Please enter your annual gross income")).toBeInTheDocument();
    });

    it("drops the currency formatting once a letter is present", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "1234a");

      expect(input).toHaveValue("1234a");
    });

    it("shows a validation error after typing then clearing the field", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "5");
      await user.clear(input);
      await user.tab();

      expect(await screen.findByText("Please enter your annual gross income")).toBeInTheDocument();
    });

    it("does not show an error before the field is touched", () => {
      renderComponent();

      expect(screen.queryByText("Please enter your annual gross income")).not.toBeInTheDocument();
    });

    it("accepts zero as a valid amount", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "0");
      await user.tab();

      expect(screen.queryByText(NEGATIVE_AMOUNT_ERROR_PATTERN)).not.toBeInTheDocument();
    });
  });

  describe("initialData", () => {
    it("pre-fills the input with a formatted value", () => {
      render(<IncomeContent initialData={{ annualGrossIncome: 75_000 }} />);

      expect(screen.getByRole("textbox")).toHaveValue("$75,000");
    });
  });

  describe("non-taxable income button", () => {
    it("renders the button enabled", () => {
      renderComponent();

      expect(screen.getByRole("button", { name: ADD_NON_TAXABLE_INCOME_LABEL })).toBeEnabled();
    });
  });
});
