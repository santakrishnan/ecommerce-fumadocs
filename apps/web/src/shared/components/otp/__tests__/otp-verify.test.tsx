/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OtpVerify } from "../otp-verify";

const BASE_PROPS = {
  identifier: "+1 401-555-4325",
  onVerify: vi.fn(),
};

describe("OtpVerify", () => {
  it("interpolates the identifier into the description", () => {
    render(<OtpVerify {...BASE_PROPS} description="We sent a code to {identifier}." />);
    expect(screen.getByText("We sent a code to +1 401-555-4325.")).toBeInTheDocument();
  });

  it("keeps Continue disabled until all six digits are entered", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn();
    render(<OtpVerify identifier="test@test.com" onVerify={onVerify} />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    const otpInput = document.querySelector<HTMLInputElement>('[data-slot="input-otp"]');
    if (otpInput) {
      await user.click(otpInput);
      await user.keyboard("137429");
    }

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onVerify).toHaveBeenCalledWith("137429");
  });

  it("fires onResend when Resend is clicked", async () => {
    const user = userEvent.setup();
    const onResend = vi.fn();
    render(<OtpVerify {...BASE_PROPS} onResend={onResend} onVerify={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Resend" }));
    expect(onResend).toHaveBeenCalledOnce();
  });
});
