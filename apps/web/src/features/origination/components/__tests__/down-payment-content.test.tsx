/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { DOWN_PAYMENT_CONTEXT_FIXTURE } from "../../bff/__fixtures__/down-payment.fixture";
import { DownPaymentContent } from "../down-payment-content";

const { presets } = DOWN_PAYMENT_CONTEXT_FIXTURE;
const [firstPreset, secondPreset] = presets;

if (!(firstPreset && secondPreset)) {
  throw new Error("DOWN_PAYMENT_CONTEXT_FIXTURE must contain at least two presets");
}

function renderComponent() {
  return render(<DownPaymentContent presets={presets} />);
}

describe("DownPaymentContent", () => {
  describe("preset pills", () => {
    it("renders a pill for each preset", () => {
      renderComponent();

      for (const preset of presets) {
        expect(screen.getByText(`(${preset.percentage}%)`)).toBeInTheDocument();
      }
    });

    it("no pill is selected by default", () => {
      renderComponent();

      const buttons = screen.getAllByRole("button");
      for (const button of buttons) {
        expect(button).toHaveAttribute("aria-pressed", "false");
      }
    });

    it("clicking a preset sets aria-pressed on that pill and fills the input", async () => {
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button", { name: new RegExp(`${firstPreset.percentage}%`) });

      await user.click(button);

      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("textbox")).toHaveValue(String(firstPreset.amount));
    });

    it("clicking a different preset deselects the previous one", async () => {
      const user = userEvent.setup();
      renderComponent();

      const firstButton = screen.getByRole("button", {
        name: new RegExp(`${firstPreset.percentage}%`),
      });
      const secondButton = screen.getByRole("button", {
        name: new RegExp(`${secondPreset.percentage}%`),
      });

      await user.click(firstButton);
      await user.click(secondButton);

      expect(firstButton).toHaveAttribute("aria-pressed", "false");
      expect(secondButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("text input", () => {
    it("typing a numeric value updates the input", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "4000");

      expect(input).toHaveValue("4000");
    });

    it("shows a validation error after typing then clearing the field", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "5");
      await user.clear(input);
      await user.tab();

      expect(await screen.findByText("Please enter a down payment amount")).toBeInTheDocument();
    });

    it("shows a validation error after blurring with zero", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "0");
      await user.tab();

      expect(await screen.findByText("Amount must be greater than $0")).toBeInTheDocument();
    });

    it("shows a validation error for a negative value", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole("textbox");
      await user.type(input, "-500");
      await user.tab();

      expect(await screen.findByText("Amount must be greater than $0")).toBeInTheDocument();
    });

    it("does not show an error before the field is touched", () => {
      renderComponent();

      expect(screen.queryByText("Please enter a down payment amount")).not.toBeInTheDocument();
    });
  });

  describe("initialData", () => {
    it("pre-fills the input and selects the matching preset", () => {
      render(
        <DownPaymentContent
          initialData={{ downPaymentAmount: firstPreset.amount }}
          presets={presets}
        />
      );

      expect(screen.getByRole("textbox")).toHaveValue(String(firstPreset.amount));
      expect(
        screen.getByRole("button", { name: new RegExp(`${firstPreset.percentage}%`) })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});
