/// <reference types="@testing-library/jest-dom" />

import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import {
  PHONE_VERIFICATION_DESCRIPTION,
  PHONE_VERIFICATION_TITLE,
  PhoneVerificationContent,
} from "../phone-verification-content";

const PHONE_LABEL = "Phone number";
const PHONE_PLACEHOLDER = "(xxx) xxx-xxxx";
const PHONE_VALIDATION_ERROR = "Enter a valid 10-digit phone number";

describe("PhoneVerificationContent", () => {
  it("renders the phone field with its placeholder and no error before touch", () => {
    render(<PhoneVerificationContent />);

    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    expect(input).toHaveAttribute("placeholder", PHONE_PLACEHOLDER);
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("formats typed digits as a U.S. phone number", async () => {
    const user = userEvent.setup();
    render(<PhoneVerificationContent />);

    await user.type(screen.getByRole("textbox", { name: PHONE_LABEL }), "5551234567");

    expect(screen.getByRole("textbox", { name: PHONE_LABEL })).toHaveValue("(555) 123-4567");
    expect(screen.getByRole("textbox", { name: PHONE_LABEL })).toHaveAttribute(
      "aria-invalid",
      "false"
    );
  });

  it("keeps the entered value when an eleventh digit follows a number starting with one", async () => {
    const user = userEvent.setup();
    render(<PhoneVerificationContent />);
    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    await user.type(input, "1234567890");
    await user.type(input, "1");

    expect(input).toHaveValue("(123) 456-7890");
  });

  it.each([
    "+1 (555) 123-4567",
    "1-555-123-4567",
  ])("normalizes pasted value %s", async (pastedValue) => {
    const user = userEvent.setup();
    render(<PhoneVerificationContent />);
    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    await user.click(input);
    await user.paste(pastedValue);

    expect(input).toHaveValue("(555) 123-4567");
  });

  it("shows an inline error after an incomplete value is blurred", async () => {
    const user = userEvent.setup();
    render(<PhoneVerificationContent />);
    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    await user.type(input, "555123");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.tab();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(PHONE_VALIDATION_ERROR);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "origination-phone-error");
    expect(input.closest('[data-slot="field"]')).toHaveAttribute("data-invalid", "true");
  });

  it("keeps a valid phone value in a valid field state", async () => {
    const user = userEvent.setup();
    render(<PhoneVerificationContent />);
    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    await user.type(input, "5551234567");

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("pre-fills and formats initial phone data", () => {
    render(<PhoneVerificationContent initialData={{ phone: "5551234567" }} />);

    const input = screen.getByRole("textbox", { name: PHONE_LABEL });

    expect(input).toHaveValue("(555) 123-4567");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("exports the Figma title and description copy", () => {
    expect(PHONE_VERIFICATION_TITLE).toBe("Let's verify your phone number");
    expect(PHONE_VERIFICATION_DESCRIPTION).toBe(
      "We'll send a verification code to your phone number."
    );
  });

  it("renders only the phone field and inline validation", () => {
    render(<PhoneVerificationContent />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
