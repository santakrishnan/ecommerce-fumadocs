/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { TRADE_IN_DESCRIPTION, TRADE_IN_TITLE, TradeInContent } from "../trade-in-content";

const PLATE_VIN_LABEL = "License plate or VIN";
const VIN_HELP_LABEL = "Need help finding your VIN?";
const VIN_17 = "1HGCM82633A004352";

describe("TradeInContent", () => {
  it("exposes title and description constants for the panel layout", () => {
    expect(TRADE_IN_TITLE).toBe("Would you like to trade in your vehicle?");
    expect(TRADE_IN_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it("renders the plate/VIN field and the VIN help button", () => {
    render(<TradeInContent />);

    expect(screen.getByLabelText(PLATE_VIN_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: VIN_HELP_LABEL })).toBeInTheDocument();
  });

  it("does not show a validation error before the field is touched", () => {
    render(<TradeInContent />);

    expect(screen.queryByText("Enter a license plate or VIN")).not.toBeInTheDocument();
  });

  it("shows a validation error after typing then clearing the plate/VIN field", async () => {
    const user = userEvent.setup();
    render(<TradeInContent />);

    const input = screen.getByLabelText(PLATE_VIN_LABEL);
    await user.type(input, "A");
    await user.clear(input);
    await user.tab();

    expect(await screen.findByText("Enter a license plate or VIN")).toBeInTheDocument();
  });

  it("accepts a plate with the default state without surfacing an error", async () => {
    const user = userEvent.setup();
    render(<TradeInContent />);

    const input = screen.getByLabelText(PLATE_VIN_LABEL);
    await user.type(input, "ABC1234");
    await user.tab();

    expect(input).toHaveValue("ABC1234");
    expect(screen.queryByText("Enter a license plate or VIN")).not.toBeInTheDocument();
    expect(screen.queryByText("Select your state")).not.toBeInTheDocument();
  });

  it("accepts a 17-character VIN", async () => {
    const user = userEvent.setup();
    render(<TradeInContent />);

    const input = screen.getByLabelText(PLATE_VIN_LABEL);
    await user.type(input, VIN_17);
    await user.tab();

    expect(input).toHaveValue(VIN_17);
    expect(screen.queryByText("Enter a license plate or VIN")).not.toBeInTheDocument();
  });

  it("pre-fills the plate/VIN field from initialData", () => {
    render(<TradeInContent initialData={{ plateOrVin: "XYZ9876", state: "CA" }} />);

    expect(screen.getByLabelText(PLATE_VIN_LABEL)).toHaveValue("XYZ9876");
  });
});
