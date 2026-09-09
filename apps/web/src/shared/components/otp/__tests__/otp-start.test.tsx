/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { OtpStart } from "../otp-start";

/*
 * Interactive behavior (typing, submission, validation feedback) can't run in
 * jsdom because @base-ui/react's InputPrimitive doesn't forward onChange here.
 * Those paths are covered by shared/lib/__tests__/otp-channel.test.ts and E2E.
 */

const BASE_PROPS = {
  description: "Test description text",
  onSubmit: vi.fn(),
  title: "Test Title",
};

function renderOtpStart(overrides = {}) {
  return render(<OtpStart {...BASE_PROPS} onSubmit={vi.fn()} {...overrides} />);
}

describe("OtpStart", () => {
  it("renders the title, description, and contact input", () => {
    renderOtpStart();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description text")).toBeInTheDocument();
    expect(screen.getByText("Phone number or email")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "otp-start-contact");
  });

  it("disables Continue until the input is valid", () => {
    renderOtpStart();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("renders the hint only when provided", () => {
    const { rerender } = renderOtpStart();
    expect(screen.queryByText("Sign in below")).not.toBeInTheDocument();
    rerender(<OtpStart {...BASE_PROPS} hint="Sign in below" />);
    expect(screen.getByText("Sign in below")).toBeInTheDocument();
  });
});
